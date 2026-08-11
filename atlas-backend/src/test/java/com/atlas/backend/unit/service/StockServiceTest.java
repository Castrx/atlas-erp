package com.atlas.backend.unit.service;

import com.atlas.backend.dto.stock.StockMovementRequest;
import com.atlas.backend.entity.MovementType;
import com.atlas.backend.entity.Product;
import com.atlas.backend.entity.StockMovement;
import com.atlas.backend.entity.User;
import com.atlas.backend.exception.BusinessException;
import com.atlas.backend.repository.ProductRepository;
import com.atlas.backend.repository.StockMovementRepository;
import com.atlas.backend.repository.UserRepository;
import com.atlas.backend.service.StockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários com Mockito para as regras de estoque de Entrada/Saída:
 * incremento, decremento e recusa de saída quando o estoque é insuficiente.
 * Verificam também que o produto é lido via {@code findByIdForUpdate}
 * (caminho do lock pessimista) antes da leitura-modificação-escrita do
 * estoque.
 */
@ExtendWith(MockitoExtension.class)
class StockServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private StockService stockService;

    private static final String EMAIL = "operador@teste.local";

    private Product produto;
    private User usuario;
    private Authentication auth;

    @BeforeEach
    void setUp() {
        produto = Product.builder()
                .id(1L)
                .name("Produto de Teste")
                .sku("SKU-1")
                .costPrice(BigDecimal.TEN)
                .salePrice(new BigDecimal("20.00"))
                .stock(5)
                .minimumStock(1)
                .build();

        usuario = User.builder()
                .id(1L)
                .email(EMAIL)
                .build();

        auth = new UsernamePasswordAuthenticationToken(EMAIL, null);
    }

    /** Stubs de usuário/movimento — usadas apenas quando a movimentação é aceita. */
    private void mockUsuarioEMovimento() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario));
        when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void entry_deveIncrementarEstoque_eRegistrarMovimentoDeEntrada() {
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(produto));
        mockUsuarioEMovimento();

        stockService.entry(new StockMovementRequest(1L, 10, "Reposição de teste"), auth);

        assertThat(produto.getStock()).isEqualTo(15);
        verify(productRepository).findByIdForUpdate(1L);
        verify(stockMovementRepository).save(org.mockito.ArgumentMatchers.argThat(
                m -> m.getType() == MovementType.ENTRY
                        && m.getQuantity() == 10
                        && m.getReason().equals("Reposição de teste")));
    }

    @Test
    void exit_deveDecrementarEstoque_eRegistrarMovimentoDeSaida_quandoEstoqueSuficiente() {
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(produto));
        mockUsuarioEMovimento();

        stockService.exit(new StockMovementRequest(1L, 2, "Saída de teste"), auth);

        assertThat(produto.getStock()).isEqualTo(3);
        verify(productRepository).findByIdForUpdate(1L);
        verify(stockMovementRepository).save(org.mockito.ArgumentMatchers.argThat(
                m -> m.getType() == MovementType.EXIT
                        && m.getQuantity() == 2
                        && m.getReason().equals("Saída de teste")));
    }

    @Test
    void exit_deveLancarBusinessException_eNaoMovimentarNada_quandoEstoqueInsuficiente() {
        produto.setStock(1);
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(produto));

        assertThatThrownBy(() -> stockService.exit(new StockMovementRequest(1L, 2, "Saída de teste"), auth))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Estoque insuficiente.");

        assertThat(produto.getStock()).isEqualTo(1);
        verify(productRepository, never()).save(produto);
        verify(stockMovementRepository, never()).save(any());
    }
}
