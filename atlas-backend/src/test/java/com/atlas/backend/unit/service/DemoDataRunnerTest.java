package com.atlas.backend.unit.service;

import com.atlas.backend.config.DemoDataRunner;
import com.atlas.backend.entity.Category;
import com.atlas.backend.entity.Company;
import com.atlas.backend.entity.Customer;
import com.atlas.backend.entity.MovementType;
import com.atlas.backend.entity.Product;
import com.atlas.backend.entity.Sale;
import com.atlas.backend.entity.StockMovement;
import com.atlas.backend.repository.CategoryRepository;
import com.atlas.backend.repository.CompanyRepository;
import com.atlas.backend.repository.CustomerRepository;
import com.atlas.backend.repository.ProductRepository;
import com.atlas.backend.repository.SaleItemRepository;
import com.atlas.backend.repository.SaleRepository;
import com.atlas.backend.repository.StockMovementRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Testes unitários do {@link DemoDataRunner} (AE-065) — Mockito puro, sem
 * Spring context, sem banco. Cobrem os três comportamentos contratados:
 * inerte com {@code enabled=false}, criação coerente de todos os dados com
 * {@code enabled=true}, e idempotência quando os registros já existem.
 */
@ExtendWith(MockitoExtension.class)
class DemoDataRunnerTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private SaleItemRepository saleItemRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    private DemoDataRunner runner(boolean enabled) {
        return new DemoDataRunner(
                companyRepository, categoryRepository, productRepository, customerRepository,
                saleRepository, saleItemRepository, stockMovementRepository, enabled);
    }

    @Test
    void run_deveSerCompletamenteInerte_quandoDesabilitado() {
        runner(false).run(new DefaultApplicationArguments(new String[0]));

        verifyNoInteractions(companyRepository, categoryRepository, productRepository,
                customerRepository, saleRepository, saleItemRepository, stockMovementRepository);
    }

    @Test
    void run_deveCriarDadosCoerentes_quandoHabilitado() {
        List<Category> categories = List.of(
                Category.builder().name("Eletrônicos").build(),
                Category.builder().name("Informática").build(),
                Category.builder().name("Periféricos").build(),
                Category.builder().name("Escritório").build(),
                Category.builder().name("Acessórios").build());

        when(categoryRepository.findAll()).thenReturn(categories);
        when(companyRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(categoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(customerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(saleRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(saleItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(stockMovementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        runner(true).run(new DefaultApplicationArguments(new String[0]));

        // Empresa de demonstração (guarda por CNPJ).
        ArgumentCaptor<Company> companyCaptor = ArgumentCaptor.forClass(Company.class);
        verify(companyRepository, times(1)).save(companyCaptor.capture());
        assertThat(companyCaptor.getValue().getCnpj()).isEqualTo(DemoDataRunner.DEMO_CNPJ);

        // 5 categorias.
        ArgumentCaptor<Category> categoryCaptor = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository, times(5)).save(categoryCaptor.capture());
        assertThat(categoryCaptor.getAllValues())
                .extracting(Category::getName)
                .containsExactlyInAnyOrder(
                        "Eletrônicos", "Informática", "Periféricos", "Escritório", "Acessórios");

        // 8 criações + 9 baixas de estoque = 17 saves de produto. Como o mock
        // devolve a própria entidade, o captor vê o estoque já atualizado.
        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository, times(17)).save(productCaptor.capture());
        Map<String, Product> bySku = productCaptor.getAllValues().stream()
                .collect(Collectors.toMap(Product::getSku, p -> p, (a, b) -> b));
        assertThat(bySku).hasSize(8);
        assertThat(bySku.get("NOTE-001").getStock()).isEqualTo(5);  // 6 - 1
        assertThat(bySku.get("TEC-001").getStock()).isEqualTo(8);   // 11 - 2 - 1
        assertThat(bySku.get("CAD-001").getStock()).isEqualTo(1);   // 2 - 1
        assertThat(bySku.get("SOM-001").getStock()).isZero();       // 1 - 1 (zerado p/ alerta de dashboard)

        // 5 clientes.
        ArgumentCaptor<Customer> customerCaptor = ArgumentCaptor.forClass(Customer.class);
        verify(customerRepository, times(5)).save(customerCaptor.capture());

        // 9 itens de venda.
        verify(saleItemRepository, times(9)).save(any());

        // 10 saves de venda (5 criação + 5 atualização do total). Cada venda é
        // o MESMO objeto nas duas chamadas, então distinct() deduplica.
        ArgumentCaptor<Sale> saleCaptor = ArgumentCaptor.forClass(Sale.class);
        verify(saleRepository, times(10)).save(saleCaptor.capture());
        List<Sale> finalizedSales = saleCaptor.getAllValues().stream()
                .filter(s -> s.getTotal() != null && s.getTotal().compareTo(BigDecimal.ZERO) > 0)
                .distinct()
                .toList();
        assertThat(finalizedSales).hasSize(5);

        BigDecimal revenue = finalizedSales.stream()
                .map(Sale::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(revenue).isEqualByComparingTo("11670.00");

        Sale anaSale = finalizedSales.stream()
                .filter(s -> "12345678901".equals(s.getCustomer().getDocument()))
                .findFirst().orElseThrow();
        assertThat(anaSale.getTotal()).isEqualByComparingTo("5448.00");

        // 17 movimentos: 8 ENTRY (carga inicial) + 9 EXIT (vendas).
        ArgumentCaptor<StockMovement> movementCaptor = ArgumentCaptor.forClass(StockMovement.class);
        verify(stockMovementRepository, times(17)).save(movementCaptor.capture());
        long entries = movementCaptor.getAllValues().stream()
                .filter(m -> m.getType() == MovementType.ENTRY)
                .count();
        long exits = movementCaptor.getAllValues().stream()
                .filter(m -> m.getType() == MovementType.EXIT)
                .count();
        assertThat(entries).isEqualTo(8);
        assertThat(exits).isEqualTo(9);
    }

    @Test
    void run_deveSerIdempotente_quandoRegistrosJaExistem() {
        when(companyRepository.existsByCnpj(DemoDataRunner.DEMO_CNPJ)).thenReturn(true);
        when(categoryRepository.existsByNameIgnoreCase(any())).thenReturn(true);
        when(productRepository.existsBySku(any())).thenReturn(true);
        when(categoryRepository.findAll()).thenReturn(List.of());

        runner(true).run(new DefaultApplicationArguments(new String[0]));

        verify(companyRepository, never()).save(any());
        verify(categoryRepository, never()).save(any());
        verify(productRepository, never()).save(any());
        verify(customerRepository, never()).save(any());
        verify(customerRepository, never()).existsByDocument(any());
        verify(saleRepository, never()).save(any());
        verify(saleItemRepository, never()).save(any());
        verify(stockMovementRepository, never()).save(any());
    }
}
