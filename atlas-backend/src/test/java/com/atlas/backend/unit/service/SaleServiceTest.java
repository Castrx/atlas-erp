package com.atlas.backend.unit.service;

import com.atlas.backend.dto.sale.SaleItemRequest;
import com.atlas.backend.dto.sale.SaleRequest;
import com.atlas.backend.dto.sale.SaleResponse;
import com.atlas.backend.entity.Customer;
import com.atlas.backend.entity.MovementType;
import com.atlas.backend.entity.Product;
import com.atlas.backend.entity.Sale;
import com.atlas.backend.entity.SaleItem;
import com.atlas.backend.entity.SaleStatus;
import com.atlas.backend.entity.StockMovement;
import com.atlas.backend.entity.User;
import com.atlas.backend.exception.BusinessException;
import com.atlas.backend.repository.CustomerRepository;
import com.atlas.backend.repository.ProductRepository;
import com.atlas.backend.repository.SaleItemRepository;
import com.atlas.backend.repository.SaleRepository;
import com.atlas.backend.repository.StockMovementRepository;
import com.atlas.backend.repository.UserRepository;
import com.atlas.backend.service.SaleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários com Mockito para as regras de negócio de Venda que
 * envolvem estoque: venda normal baixa o estoque, venda com estoque
 * insuficiente é recusada sem movimentar nada, e o cancelamento restaura o
 * estoque. Além disso, verificam que o produto é lido via
 * {@code findByIdForUpdate} (caminho do lock pessimista) nos dois fluxos.
 */
@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private SaleItemRepository saleItemRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @InjectMocks
    private SaleService saleService;

    private static final String EMAIL = "vendedor@teste.local";

    private Customer cliente;
    private User usuario;
    private Product produto;
    private Authentication auth;

    @BeforeEach
    void setUp() {
        cliente = Customer.builder()
                .id(1L)
                .name("Cliente de Teste")
                .build();

        usuario = User.builder()
                .id(1L)
                .name("Vendedor de Teste")
                .email(EMAIL)
                .build();

        produto = Product.builder()
                .id(1L)
                .name("Produto de Teste")
                .sku("SKU-1")
                .costPrice(BigDecimal.TEN)
                .salePrice(new BigDecimal("20.00"))
                .stock(5)
                .minimumStock(1)
                .build();

        auth = new UsernamePasswordAuthenticationToken(EMAIL, null);
    }

    private void mockBase() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario));
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> {
            Sale sale = inv.getArgument(0);
            if (sale.getId() == null) {
                sale.setId(1L);
            }
            return sale;
        });
    }

    /** Stubs de persistência de item/movimento — usadas apenas quando a venda é aceita. */
    private void mockPersistencia() {
        when(saleItemRepository.save(any(SaleItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void create_deveBaixarEstoque_eRegistrarMovimentoDeSaida_quandoEstoqueSuficiente() {
        mockBase();
        mockPersistencia();
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(produto));

        SaleRequest request = new SaleRequest(
                1L,
                List.of(new SaleItemRequest(1L, 2)));

        SaleResponse response = saleService.create(request, auth);

        assertThat(response.total()).isEqualByComparingTo(new BigDecimal("40.00"));
        assertThat(produto.getStock()).isEqualTo(3);

        // O produto foi lido pelo caminho do lock pessimista.
        verify(productRepository).findByIdForUpdate(1L);
        verify(productRepository).save(produto);

        verify(stockMovementRepository).save(org.mockito.ArgumentMatchers.argThat(
                m -> m.getType() == MovementType.EXIT
                        && m.getQuantity() == 2
                        && m.getReason().equals("Venda #1")));
    }

    @Test
    void create_deveLancarBusinessException_eNaoMovimentarNada_quandoEstoqueInsuficiente() {
        mockBase();
        produto.setStock(1);
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(produto));

        SaleRequest request = new SaleRequest(
                1L,
                List.of(new SaleItemRequest(1L, 2)));

        assertThatThrownBy(() -> saleService.create(request, auth))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Estoque insuficiente para o produto: Produto de Teste");

        assertThat(produto.getStock()).isEqualTo(1);
        verify(productRepository, never()).save(produto);
        verify(saleItemRepository, never()).save(any());
        verify(stockMovementRepository, never()).save(any());
    }

    @Test
    void cancel_deveRestaurarEstoque_eMarcarVendaComoCancelada() {
        Sale venda = Sale.builder()
                .id(1L)
                .customer(cliente)
                .total(new BigDecimal("40.00"))
                .status(SaleStatus.ACTIVE)
                .createdBy(EMAIL)
                .build();

        SaleItem item = SaleItem.builder()
                .id(1L)
                .sale(venda)
                .product(produto)
                .quantity(2)
                .unitPrice(new BigDecimal("20.00"))
                .subtotal(new BigDecimal("40.00"))
                .build();

        when(saleRepository.findById(1L)).thenReturn(Optional.of(venda));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario));
        when(saleItemRepository.findBySale(venda)).thenReturn(List.of(item));
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(produto));
        when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(inv -> inv.getArgument(0));

        saleService.cancel(1L, auth);

        assertThat(venda.getStatus()).isEqualTo(SaleStatus.CANCELED);
        assertThat(produto.getStock()).isEqualTo(7);

        // O produto foi relido com lock antes de restaurar o estoque.
        verify(productRepository).findByIdForUpdate(1L);

        verify(stockMovementRepository).save(org.mockito.ArgumentMatchers.argThat(
                m -> m.getType() == MovementType.ENTRY
                        && m.getQuantity() == 2
                        && m.getReason().equals("Cancelamento da Venda #1")));
    }

    @Test
    void cancel_deveLancarBusinessException_quandoVendaJaCancelada() {
        Sale venda = Sale.builder()
                .id(1L)
                .customer(cliente)
                .status(SaleStatus.CANCELED)
                .build();

        when(saleRepository.findById(1L)).thenReturn(Optional.of(venda));

        assertThatThrownBy(() -> saleService.cancel(1L, auth))
                .isInstanceOf(BusinessException.class)
                .hasMessage("A venda já está cancelada.");

        verify(productRepository, never()).findByIdForUpdate(any());
        verify(saleItemRepository, never()).findBySale(any());
    }
}
