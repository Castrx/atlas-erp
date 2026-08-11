package com.atlas.backend.integration;

import com.atlas.backend.config.DemoDataRunner;
import com.atlas.backend.entity.Company;
import com.atlas.backend.entity.Product;
import com.atlas.backend.entity.Sale;
import com.atlas.backend.entity.SaleStatus;
import com.atlas.backend.repository.CategoryRepository;
import com.atlas.backend.repository.CompanyRepository;
import com.atlas.backend.repository.CustomerRepository;
import com.atlas.backend.repository.ProductRepository;
import com.atlas.backend.repository.SaleRepository;
import com.atlas.backend.repository.StockMovementRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prova o {@link DemoDataRunner} (AE-065) de ponta a ponta, com contexto
 * Spring real e PostgreSQL efêmero. O runner roda na subida do contexto
 * ({@code demo-data.enabled=true}) e cria os dados; o teste valida a
 * coerência, e uma segunda execução do runner prova a idempotência.
 *
 * <p><b>Não estende {@link com.atlas.backend.support.AbstractIntegrationTest}
 * de propósito.</b> Os dados de demonstração são COMMITADOS na subida do
 * contexto (ApplicationRunner) e um commit vazaria para o container
 * compartilhado dos demais ITs, contaminando suas contagens (Produto, Cliente,
 * Venda, Dashboard). Este container tem banco próprio
 * ({@code atlas_erp_demo_test}) e absorve toda a contaminação.
 */
@TestPropertySource(properties = "demo-data.enabled=true")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
class DemoDataRunnerIT {

    static final PostgreSQLContainer<?> POSTGRES;

    static {
        POSTGRES = new PostgreSQLContainer<>("postgres:17")
                .withDatabaseName("atlas_erp_demo_test")
                .withUsername("atlas")
                .withPassword("atlas123");
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void overrideDatasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private DemoDataRunner demoDataRunner;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Test
    void startup_deveCriarDadosDeDemonstracaoCoerentes() {

        Company company = companyRepository.findByCnpj(DemoDataRunner.DEMO_CNPJ).orElse(null);
        assertThat(company).isNotNull();
        assertThat(company.getTradeName()).isEqualTo("Atlas Comércio");

        assertThat(categoryRepository.count()).isEqualTo(5);
        assertThat(productRepository.count()).isEqualTo(8);
        assertThat(customerRepository.count()).isEqualTo(5);

        List<Sale> sales = saleRepository.findByStatus(SaleStatus.ACTIVE);
        assertThat(sales).hasSize(5);

        assertThat(stockMovementRepository.count()).isEqualTo(17);

        // Estoques finais: vendas consomem estoque; 3 produtos abaixo/na margem
        // mínima alimentam os alertas do dashboard.
        assertThat(productBySku("NOTE-001").getStock()).isEqualTo(5); // 6 - 1
        assertThat(productBySku("CAD-001").getStock()).isEqualTo(1);  // 2 - 1
        assertThat(productBySku("SOM-001").getStock()).isZero();      // 1 - 1

        BigDecimal revenue = saleRepository.getRevenueSince(LocalDateTime.now().minusDays(7));
        assertThat(revenue).isEqualByComparingTo("11670.00");
    }

    @Test
    void segundaExecucao_deveSerIdempotente() {
        demoDataRunner.run(new DefaultApplicationArguments(new String[0]));

        assertThat(companyRepository.findByCnpj(DemoDataRunner.DEMO_CNPJ)).isPresent();
        assertThat(categoryRepository.count()).isEqualTo(5);
        assertThat(productRepository.count()).isEqualTo(8);
        assertThat(customerRepository.count()).isEqualTo(5);
        assertThat(saleRepository.findByStatus(SaleStatus.ACTIVE)).hasSize(5);
        assertThat(stockMovementRepository.count()).isEqualTo(17);
    }

    private Product productBySku(String sku) {
        return productRepository.findAll().stream()
                .filter(p -> p.getSku().equals(sku))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Produto de demonstração " + sku + " não encontrado"));
    }
}
