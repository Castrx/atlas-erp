package com.atlas.backend.integration;

import com.atlas.backend.dto.customer.CustomerRequest;
import com.atlas.backend.support.AbstractIntegrationTest;
import com.atlas.backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de integração de ponta a ponta: controller real, security real
 * (rota autenticada via JWT genuíno), banco real (Postgres efêmero via
 * Testcontainers). Cobre o fluxo de cadastro e listagem de Clientes e a
 * regra de negócio de documento duplicado.
 */
class CustomerControllerIT extends AbstractIntegrationTest {

    @Test
    void findAll_deveRetornar401_semAutenticacao() throws Exception {
        mockMvc.perform(get("/customers"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void create_deveRetornar200_comClienteValido() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        CustomerRequest request = TestDataFactory.customerRequest(TestDataFactory.uniqueDocument());

        mockMvc.perform(post("/customers")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.document").value(request.document()))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void create_deveRetornar409_quandoDocumentoDuplicado() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        CustomerRequest request = TestDataFactory.customerRequest(TestDataFactory.uniqueDocument());

        mockMvc.perform(post("/customers")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/customers")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Já existe um cliente com este documento."));
    }

    @Test
    void create_deveRetornar400_quandoDocumentoEmBranco() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");

        String payloadComDocumentoVazio = """
                {
                  "name": "Cliente sem documento",
                  "document": ""
                }
                """;

        mockMvc.perform(post("/customers")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadComDocumentoVazio))
                .andExpect(status().isBadRequest());
    }

    @Test
    void findAll_deveListarClienteRecemCriado() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        CustomerRequest request = TestDataFactory.customerRequest(TestDataFactory.uniqueDocument());

        mockMvc.perform(post("/customers")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/customers")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(request.document())));
    }
}
