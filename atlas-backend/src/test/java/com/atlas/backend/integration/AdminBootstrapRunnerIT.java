package com.atlas.backend.integration;

import com.atlas.backend.dto.auth.LoginResponse;
import com.atlas.backend.support.AbstractIntegrationTest;
import com.atlas.backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Prova o bootstrap do primeiro ADMIN (AE-045) de ponta a ponta, com contexto
 * Spring real e PostgreSQL efêmero: define as variáveis de bootstrap via
 * properties de teste, o {@code AdminBootstrapRunner} cria o ADMIN na subida
 * do contexto, e o teste valida que esse ADMIN consegue logar e acessar um
 * endpoint ADMIN-only ({@code GET /users}).
 *
 * <p>Contexto próprio (propriedades diferentes) — o contexto base dos demais
 * ITs roda o runner sem variáveis, portanto inerte.
 */
@TestPropertySource(properties = {
        "admin.bootstrap.email=admin.bootstrap@teste.local",
        "admin.bootstrap.password=Atlas@BootstrapTeste",
        "admin.bootstrap.name=Admin Bootstrap"
})
class AdminBootstrapRunnerIT extends AbstractIntegrationTest {

    @Test
    void bootstrap_deveCriarAdminQueConsegueLogarEChamarEndpointAdminOnly() throws Exception {

        String responseBody = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                TestDataFactory.loginRequest(
                                        "admin.bootstrap@teste.local",
                                        "Atlas@BootstrapTeste"))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = objectMapper.readValue(responseBody, LoginResponse.class).token();

        mockMvc.perform(get("/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}
