package com.atlas.backend.unit.service;

import com.atlas.backend.dto.product.CreateProductRequest;
import com.atlas.backend.dto.product.ProductResponse;
import com.atlas.backend.dto.product.UpdateProductRequest;
import com.atlas.backend.entity.Category;
import com.atlas.backend.entity.Product;
import com.atlas.backend.exception.BusinessException;
import com.atlas.backend.repository.CategoryRepository;
import com.atlas.backend.repository.ProductRepository;
import com.atlas.backend.service.ProductService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários com Mockito — repositórios mockados, sem Spring context,
 * sem banco. Cobre as regras de negócio reais de Produto: SKU duplicado,
 * categoria inexistente, estoque padrão zero quando não informado, e o
 * cuidado de não disparar duplicidade quando o SKU não muda no update.
 */
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private ProductService productService;

    private Category categoria() {
        return Category.builder().id(1L).name("Categoria de Teste").build();
    }

    @Test
    void create_deveLancarBusinessException_quandoSkuJaExiste() {
        CreateProductRequest request = new CreateProductRequest(
                "Produto", null, "SKU-DUP", null,
                BigDecimal.TEN, BigDecimal.valueOf(20), 5, 1, 1L);

        when(productRepository.existsBySku("SKU-DUP")).thenReturn(true);

        assertThatThrownBy(() -> productService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Já existe um produto com este SKU.");

        verify(productRepository, never()).save(any());
    }

    @Test
    void create_deveLancarBusinessException_quandoCategoriaNaoExiste() {
        CreateProductRequest request = new CreateProductRequest(
                "Produto", null, "SKU-NOVO", null,
                BigDecimal.TEN, BigDecimal.valueOf(20), 5, 1, 99L);

        when(productRepository.existsBySku("SKU-NOVO")).thenReturn(false);
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Categoria não encontrada.");

        verify(productRepository, never()).save(any());
    }

    @Test
    void create_deveUsarZeroComoPadrao_quandoEstoqueNaoInformado() {
        CreateProductRequest request = new CreateProductRequest(
                "Produto", null, "SKU-NOVO", null,
                BigDecimal.TEN, BigDecimal.valueOf(20), null, null, 1L);

        when(productRepository.existsBySku("SKU-NOVO")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(categoria()));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        ProductResponse response = productService.create(request);

        assertThat(response.stock()).isZero();
        assertThat(response.minimumStock()).isZero();
    }

    @Test
    void update_naoDeveVerificarDuplicidade_quandoSkuPermaneceOMesmo() {
        Product existente = Product.builder()
                .id(1L).name("Antigo").sku("SKU-1")
                .costPrice(BigDecimal.TEN).salePrice(BigDecimal.valueOf(20))
                .stock(5).minimumStock(1)
                .category(categoria())
                .build();

        UpdateProductRequest request = new UpdateProductRequest(
                "Novo nome", null, "SKU-1", null,
                BigDecimal.TEN, BigDecimal.valueOf(25), 10, 2, 1L);

        when(productRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(categoria()));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        ProductResponse response = productService.update(1L, request);

        assertThat(response.name()).isEqualTo("Novo nome");
        verify(productRepository, never()).existsBySku(anyString());
    }

    @Test
    void update_deveLancarBusinessException_quandoNovoSkuJaPertenceAOutroProduto() {
        Product existente = Product.builder()
                .id(1L).sku("SKU-1")
                .category(categoria())
                .build();

        UpdateProductRequest request = new UpdateProductRequest(
                "Nome", null, "SKU-2", null,
                BigDecimal.TEN, BigDecimal.valueOf(20), 5, 1, 1L);

        when(productRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(productRepository.existsBySku("SKU-2")).thenReturn(true);

        assertThatThrownBy(() -> productService.update(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Já existe um produto com este SKU.");

        verify(productRepository, never()).save(any());
    }

    @Test
    void findById_deveLancarBusinessException_quandoProdutoNaoExiste() {
        when(productRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.findById(404L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Produto não encontrado.");
    }
}
