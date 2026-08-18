package com.atlas.backend.support;

import com.atlas.backend.dto.auth.LoginResponse;
import com.atlas.backend.entity.Category;
import com.atlas.backend.entity.Customer;
import com.atlas.backend.entity.Product;
import com.atlas.backend.entity.Role;
import com.atlas.backend.entity.User;
import com.atlas.backend.repository.CategoryRepository;
import com.atlas.backend.repository.CustomerRepository;
import com.atlas.backend.repository.ProductRepository;
import com.atlas.backend.repository.RoleRepository;
import com.atlas.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;

import java.math.BigDecimal;
import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base para testes de integração do backend.
 *
 * <p>Sobe um PostgreSQL efêmero via Testcontainers (mesma imagem usada em
 * {@code docker/docker-compose.yml}), completamente isolado do banco de
 * desenvolvimento — nenhum teste lê nem escreve dado real, e nenhum teste
 * depende de dado semeado manualmente. As migrations Flyway reais rodam
 * contra esse banco, então o schema testado é o schema de produção.
 *
 * <p>O container é criado uma única vez por JVM (bloco estático nesta
 * classe base) e reaproveitado por todas as subclasses — evita subir um
 * container novo a cada classe de teste. Cada método de teste roda dentro
 * de uma transação que é revertida ao final ({@code @Transactional}), então
 * o estado nunca vaza de um teste para o outro.
 *
 * <p>Requer Docker (ou Docker Desktop) em execução — mesma exigência que o
 * projeto já documenta em CONTRIBUTING.md para rodar a infraestrutura local.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Transactional
public abstract class AbstractIntegrationTest {

    protected static final PostgreSQLContainer<?> POSTGRES;

    static {
        POSTGRES = new PostgreSQLContainer<>("postgres:17")
                .withDatabaseName("atlas_erp_test")
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

    /**
     * Rate limiting de login (ver LoginRateLimiter) usa o IP remoto como
     * chave, e o MockMvc sempre reporta {@code 127.0.0.1} — sem isto, a
     * suíte inteira de integração (que registra/loga dezenas de vezes via
     * {@link #registerAndLogin}, em praticamente toda classe de teste)
     * esbarraria no limite de produção em poucos segundos. Testes
     * dedicados ao rate limiting (LoginRateLimitIT) apertam esse valor
     * pontualmente por método (via o bean RateLimitProperties) e restauram
     * ao final, sem depender de um valor diferente aqui.
     */
    @DynamicPropertySource
    static void overrideRateLimitProperties(DynamicPropertyRegistry registry) {
        registry.add("rate-limit.login.max-attempts", () -> 100_000);
        registry.add("rate-limit.login.window-seconds", () -> 60);
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected CategoryRepository categoryRepository;

    @Autowired
    protected CustomerRepository customerRepository;

    @Autowired
    protected ProductRepository productRepository;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected RoleRepository roleRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    /**
     * Registra um usuário novo (papel USER, único caminho público desde a
     * Sprint 7A - RBAC) ou provisiona um ADMIN direto via repository
     * (não há caminho público para isso, de propósito), faz login, e
     * retorna o JWT pronto para uso no header {@code Authorization}.
     * Reutilizado por todos os testes de integração que precisam de um
     * usuário autenticado — nenhum reimplementa o fluxo.
     */
    protected String registerAndLogin(String email, String role) throws Exception {

        if ("ADMIN".equals(role)) {
            persistAdminUser(email, TestDataFactory.DEFAULT_PASSWORD);
        } else {
            mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    TestDataFactory.registerRequest(email, role))))
                    .andExpect(status().isCreated());
        }

        String responseBody = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                TestDataFactory.loginRequest(email, TestDataFactory.DEFAULT_PASSWORD))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readValue(responseBody, LoginResponse.class).token();
    }

    /**
     * Cria um usuário ADMIN direto via repository, ignorando a API. Desde
     * a Sprint 7A não existe caminho público para isso — {@code POST
     * /auth/register} sempre cria USER, e {@code POST /users} é
     * ADMIN-only (quem cria o primeiro ADMIN do sistema é uma decisão de
     * provisionamento fora desta sprint, ver ressalva no relatório da
     * Sprint 7A). Este helper simula esse "primeiro ADMIN" só para teste.
     */
    protected User persistAdminUser(String email, String password) {

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException(
                        "Role ADMIN não encontrada — migration V8 não rodou?"));

        User user = User.builder()
                .name("Admin de Teste")
                .email(email)
                .password(passwordEncoder.encode(password))
                .roles(Set.of(adminRole))
                .build();

        return userRepository.save(user);
    }

    /**
     * Persiste uma categoria válida direto via repository — atalho de setup
     * para testes de Produto, que exigem uma categoria existente.
     */
    protected Category persistCategory(String name) {

        Category category = Category.builder()
                .name(name)
                .description("Categoria de teste")
                .build();

        return categoryRepository.save(category);
    }

    /**
     * Persiste um cliente válido direto via repository — atalho de setup
     * para testes de Venda, que exigem um cliente existente.
     */
    protected Customer persistCustomer(String document) {

        Customer customer = Customer.builder()
                .name("Cliente de Teste")
                .document(document)
                .build();

        return customerRepository.save(customer);
    }

    /**
     * Persiste um produto válido (com estoque) direto via repository —
     * atalho de setup para testes de Venda e Estoque.
     */
    protected Product persistProduct(String sku, Category category, int stock) {

        Product product = Product.builder()
                .name("Produto de Teste")
                .sku(sku)
                .costPrice(new BigDecimal("10.00"))
                .salePrice(new BigDecimal("20.00"))
                .stock(stock)
                .minimumStock(1)
                .category(category)
                .build();

        return productRepository.save(product);
    }
}
