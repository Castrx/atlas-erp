package com.atlas.backend.integration;

import com.atlas.backend.dto.company.CreateCompanyRequest;
import com.atlas.backend.support.AbstractIntegrationTest;
import com.atlas.backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RBAC (Sprint 7A): dados da empresa são exclusivos de ADMIN — matriz de
 * permissões em docs/architecture.md. Nenhum endpoint aqui é acessível a
 * USER.
 */
class CompanyControllerIT extends AbstractIntegrationTest {

    @Test
    void findAll_deveRetornar401_semAutenticacao() throws Exception {
        mockMvc.perform(get("/companies"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void findAll_deveRetornar403_paraUSER() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");

        mockMvc.perform(get("/companies").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void findAll_deveRetornar200_paraADMIN() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");

        mockMvc.perform(get("/companies").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void create_deveRetornar403_paraUSER() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");
        CreateCompanyRequest request = TestDataFactory.createCompanyRequest(TestDataFactory.uniqueCnpj());

        mockMvc.perform(post("/companies")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void create_deveRetornar201_paraADMIN() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        CreateCompanyRequest request = TestDataFactory.createCompanyRequest(TestDataFactory.uniqueCnpj());

        mockMvc.perform(post("/companies")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }
}
