package com.atlas.backend.config;

import com.atlas.backend.entity.Category;
import com.atlas.backend.entity.Company;
import com.atlas.backend.entity.Customer;
import com.atlas.backend.entity.MovementType;
import com.atlas.backend.entity.Product;
import com.atlas.backend.entity.Sale;
import com.atlas.backend.entity.SaleItem;
import com.atlas.backend.entity.SaleStatus;
import com.atlas.backend.entity.StockMovement;
import com.atlas.backend.repository.CategoryRepository;
import com.atlas.backend.repository.CompanyRepository;
import com.atlas.backend.repository.CustomerRepository;
import com.atlas.backend.repository.ProductRepository;
import com.atlas.backend.repository.SaleItemRepository;
import com.atlas.backend.repository.SaleRepository;
import com.atlas.backend.repository.StockMovementRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Cria dados de demonstração para o MVP (Sprint P4 / AE-065), seguindo o mesmo
 * padrão de provisionamento do {@link AdminBootstrapRunner}.
 *
 * <p>Contrato:
 * <ul>
 *   <li><b>Inerte por padrão</b>: só age quando {@code DEMO_DATA=true}
 *       (property {@code demo-data.enabled}). Ausente/false → nada é criado.</li>
 *   <li><b>Não-destrutivo</b>: nunca altera nem remove registros existentes —
 *       apenas insere o que ainda não existe, com guarda por chave única
 *       (CNPJ da empresa, nome da categoria, SKU do produto, documento do
 *       cliente).</li>
 *   <li><b>Idempotente entre reinicializações</b>: vendas e movimentos de
 *       saída só são criados quando ao menos um produto de demonstração foi
 *       criado naquela execução — um restart com {@code DEMO_DATA=true} não
 *       duplica nenhum registro, e vendas nunca decrementam estoque de produto
 *       pré-existente.</li>
 *   <li><b>Transacional</b>: tudo entra numa única transação ou nada.</li>
 * </ul>
 */
@Component
@Slf4j
public class DemoDataRunner implements ApplicationRunner {

    /** Origem de vendas/movimentos de demonstração em {@code created_by}. */
    public static final String DEMO_CREATED_BY = "demo@atlas.local";
    public static final String DEMO_CNPJ = "12345678000100";
    static final String ENTRY_REASON = "Carga inicial — dados de demonstração";

    private static final String[] COMPANY = {
            "Atlas Comércio Ltda", "Atlas Comércio", DEMO_CNPJ, "contato@atlas.local", "5133334444"
    };

    private static final String[][] CATEGORIES = {
            {"Eletrônicos", "Televisores, monitores e áudio"},
            {"Informática", "Computadores e componentes"},
            {"Periféricos", "Teclados, mouses e acessórios de entrada"},
            {"Escritório", "Mobiliário e equipamentos de escritório"},
            {"Acessórios", "Acessórios diversos"},
    };

    private record ProductDef(String sku, String name, String category, String description,
                              String costPrice, String salePrice, int initialStock, int minimumStock) {}

    private static final List<ProductDef> PRODUCTS = List.of(
            new ProductDef("NOTE-001", "Notebook Gamer 15\"", "Informática",
                    "Notebook com GPU dedicada e 16 GB de RAM", "4200.00", "5299.00", 6, 2),
            new ProductDef("TEC-001", "Teclado Mecânico TKL", "Periféricos",
                    "Switch mecânico, layout compacto", "320.00", "449.00", 11, 3),
            new ProductDef("MOU-001", "Mouse Sem Fio", "Periféricos",
                    "Conectividade 2.4 GHz e Bluetooth", "89.00", "149.00", 13, 5),
            new ProductDef("MON-001", "Monitor 27\" 4K", "Eletrônicos",
                    "Painel IPS, 60 Hz", "1600.00", "2199.00", 3, 3),
            new ProductDef("CAD-001", "Cadeira Ergonômica", "Escritório",
                    "Encosto em tela mesh, ajuste de altura", "780.00", "1199.00", 2, 2),
            new ProductDef("SOM-001", "Caixa de Som Bluetooth", "Acessórios",
                    "10 h de bateria, resistente a respingos", "140.00", "229.00", 1, 2),
            new ProductDef("WEB-001", "Webcam Full HD", "Acessórios",
                    "1080p, correção de luz", "180.00", "299.00", 8, 2),
            new ProductDef("IMP-001", "Impressora Multifuncional", "Escritório",
                    "Jato de tinta, WiFi", "650.00", "949.00", 4, 1)
    );

    private static final String[][] CUSTOMERS = {
            {"Ana Souza", "12345678901", "ana.souza@exemplo.com", "51999910001"},
            {"Bruno Lima", "23456789012", "bruno.lima@exemplo.com", "51999910002"},
            {"Carla Dias", "34567890123", "carla.dias@exemplo.com", "51999910003"},
            {"Diego Rocha", "45678901234", "diego.rocha@exemplo.com", "51999910004"},
            {"Elisa Nunes", "56789012345", "elisa.nunes@exemplo.com", "51999910005"},
    };

    private record SaleItemDef(String sku, int quantity) {}

    private record SaleDef(String customerDocument, SaleItemDef[] items) {}

    private static final List<SaleDef> SALES = List.of(
            new SaleDef("12345678901", new SaleItemDef[]{
                    new SaleItemDef("NOTE-001", 1), new SaleItemDef("MOU-001", 1)}),
            new SaleDef("23456789012", new SaleItemDef[]{
                    new SaleItemDef("TEC-001", 2), new SaleItemDef("WEB-001", 1)}),
            new SaleDef("34567890123", new SaleItemDef[]{
                    new SaleItemDef("MON-001", 1), new SaleItemDef("SOM-001", 1)}),
            new SaleDef("45678901234", new SaleItemDef[]{
                    new SaleItemDef("CAD-001", 1)}),
            new SaleDef("56789012345", new SaleItemDef[]{
                    new SaleItemDef("IMP-001", 1), new SaleItemDef("TEC-001", 1)})
    );

    private final CompanyRepository companyRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final StockMovementRepository stockMovementRepository;

    private final boolean enabled;

    public DemoDataRunner(
            CompanyRepository companyRepository,
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            CustomerRepository customerRepository,
            SaleRepository saleRepository,
            SaleItemRepository saleItemRepository,
            StockMovementRepository stockMovementRepository,
            @Value("${demo-data.enabled:false}") boolean enabled) {
        this.companyRepository = companyRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.enabled = enabled;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {

        if (!enabled) {
            log.debug("Dados de demonstração desativados (defina DEMO_DATA=true para ativá-los).");
            return;
        }

        createCompanyIfMissing();
        createCategoriesIfMissing();

        // Clientes e vendas dependem de produtos criados nesta execução —
        // idempotência: num restart em que os produtos já existem, nada é
        // criado (nem duplicado).
        List<Product> createdProducts = createProductsIfMissing();

        if (createdProducts.isEmpty()) {
            log.info("Dados de demonstração: produtos de demonstração já existentes — nada a criar.");
            return;
        }

        Map<String, Customer> customersByDocument = createCustomersIfMissing();
        createSales(createdProducts, customersByDocument);

        log.info("Dados de demonstração criados (DEMO_DATA=true).");
    }

    private void createCompanyIfMissing() {
        if (companyRepository.existsByCnpj(DEMO_CNPJ)) {
            return;
        }
        companyRepository.save(Company.builder()
                .corporateName(COMPANY[0])
                .tradeName(COMPANY[1])
                .cnpj(COMPANY[2])
                .email(COMPANY[3])
                .phone(COMPANY[4])
                .active(true)
                .build());
    }

    private void createCategoriesIfMissing() {
        for (String[] def : CATEGORIES) {
            if (categoryRepository.existsByNameIgnoreCase(def[0])) {
                continue;
            }
            categoryRepository.save(Category.builder()
                    .name(def[0])
                    .description(def[1])
                    .active(true)
                    .build());
        }
    }

    /**
     * Cria produtos de demonstração inexistentes (guarda por SKU) e um
     * movimento de ENTRY ("carga inicial") para cada um. Retorna apenas os
     * produtos criados nesta execução — produtos pré-existentes ficam de fora
     * (e não recebem movimento duplicado).
     */
    private List<Product> createProductsIfMissing() {
        List<Product> created = new ArrayList<>();

        Map<String, Category> categoriesByName = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getName, c -> c, (existing, ignored) -> existing));

        for (ProductDef def : PRODUCTS) {
            if (productRepository.existsBySku(def.sku())) {
                continue;
            }

            Category category = categoriesByName.get(def.category());
            if (category == null) {
                log.warn("Dados de demonstração: categoria '{}' do produto '{}' não encontrada — produto ignorado.",
                        def.category(), def.sku());
                continue;
            }

            Product product = Product.builder()
                    .name(def.name())
                    .description(def.description())
                    .sku(def.sku())
                    .costPrice(new BigDecimal(def.costPrice()))
                    .salePrice(new BigDecimal(def.salePrice()))
                    .stock(def.initialStock())
                    .minimumStock(def.minimumStock())
                    .category(category)
                    .active(true)
                    .build();

            created.add(productRepository.save(product));

            saveMovement(product, def.initialStock(), MovementType.ENTRY, ENTRY_REASON);
        }

        return created;
    }

    private Map<String, Customer> createCustomersIfMissing() {
        Map<String, Customer> created = new HashMap<>();

        for (String[] def : CUSTOMERS) {
            if (customerRepository.existsByDocument(def[1])) {
                continue;
            }
            Customer customer = Customer.builder()
                    .name(def[0])
                    .document(def[1])
                    .email(def[2])
                    .phone(def[3])
                    .active(true)
                    .build();
            created.put(def[1], customerRepository.save(customer));
        }

        return created;
    }

    /**
     * Cria as vendas de demonstração somente para produtos criados nesta
     * execução (via {@code createdProducts}) e clientes criados nesta execução
     * (via {@code customersByDocument}). Vendas com qualquer item de produto
     * pré-existente são ignoradas — assim nunca decrementam estoque de dados
     * existentes.
     */
    private void createSales(List<Product> createdProducts, Map<String, Customer> customersByDocument) {
        Map<String, Product> productsBySku = createdProducts.stream()
                .collect(Collectors.toMap(Product::getSku, p -> p));

        for (SaleDef def : SALES) {
            Customer customer = customersByDocument.get(def.customerDocument());
            if (customer == null) {
                log.debug("Dados de demonstração: cliente '{}' não criado nesta execução — venda ignorada.",
                        def.customerDocument());
                continue;
            }

            List<SaleItemDef> availableItems = Arrays.stream(def.items())
                    .filter(item -> productsBySku.containsKey(item.sku()))
                    .toList();
            if (availableItems.size() != def.items().length) {
                log.debug("Dados de demonstração: venda com item de produto pré-existente ignorada.");
                continue;
            }

            Sale sale = saleRepository.save(Sale.builder()
                    .customer(customer)
                    .createdBy(DEMO_CREATED_BY)
                    .total(BigDecimal.ZERO)
                    .status(SaleStatus.ACTIVE)
                    .build());

            BigDecimal total = BigDecimal.ZERO;

            for (SaleItemDef item : availableItems) {
                Product product = productsBySku.get(item.sku());

                BigDecimal subtotal = product.getSalePrice()
                        .multiply(BigDecimal.valueOf(item.quantity()));

                saleItemRepository.save(SaleItem.builder()
                        .sale(sale)
                        .product(product)
                        .quantity(item.quantity())
                        .unitPrice(product.getSalePrice())
                        .subtotal(subtotal)
                        .build());

                product.setStock(product.getStock() - item.quantity());
                productRepository.save(product);

                saveMovement(product, item.quantity(), MovementType.EXIT, "Venda #" + sale.getId());

                total = total.add(subtotal);
            }

            sale.setTotal(total);
            saleRepository.save(sale);
        }
    }

    private void saveMovement(Product product, int quantity, MovementType type, String reason) {
        stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .quantity(quantity)
                .type(type)
                .reason(reason)
                .createdBy(DEMO_CREATED_BY)
                .build());
    }
}
