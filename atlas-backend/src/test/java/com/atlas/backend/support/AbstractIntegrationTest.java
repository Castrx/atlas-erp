package com.atlas.backend.support;

import com.atlas.backend.dto.auth.LoginResponse;
import com.atlas.backend.entity.Category;
import com.atlas.backend.repository.CategoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;

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

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected CategoryRepository categoryRepository;

    /**
     * Registra um usuário novo e faz login, retornando o JWT pronto para uso
     * no header {@code Authorization} das requisições que testam rotas
     * protegidas. Reutilizado por todos os testes de integração que
     * precisam de um usuário autenticado — nenhum reimplementa o fluxo.
     */
    protected String registerAndLogin(String email, String role) throws Exception {

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                TestDataFactory.registerRequest(email, role))))
                .andExpect(status().isCreated());

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
}
