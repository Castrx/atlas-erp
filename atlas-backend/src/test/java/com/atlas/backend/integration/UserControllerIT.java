package com.atlas.backend.integration;

import com.atlas.backend.dto.user.CreateUserRequest;
import com.atlas.backend.dto.user.UpdateUserRequest;
import com.atlas.backend.support.AbstractIntegrationTest;
import com.atlas.backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RBAC (Sprint 7A): gestão de usuários é exclusiva de ADMIN — matriz de
 * permissões em docs/architecture.md. Nenhum endpoint aqui é acessível a
 * USER.
 */
class UserControllerIT extends AbstractIntegrationTest {

    @Test
    void findAll_deveRetornar401_semAutenticacao() throws Exception {
        mockMvc.perform(get("/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void findAll_deveRetornar403_paraUSER() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");

        mockMvc.perform(get("/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void findAll_deveRetornar200_paraADMIN() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");

        mockMvc.perform(get("/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void create_deveRetornar403_paraUSER() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");
        CreateUserRequest request = TestDataFactory.createUserRequest(TestDataFactory.uniqueEmail(), "USER");

        mockMvc.perform(post("/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void create_deveRetornar201_paraADMIN() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        CreateUserRequest request = TestDataFactory.createUserRequest(TestDataFactory.uniqueEmail(), "USER");

        mockMvc.perform(post("/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void create_deveRetornar400_quandoSenhaCurta() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        CreateUserRequest request = new CreateUserRequest(
                "Usuário via API", TestDataFactory.uniqueEmail(), "curta", "USER");

        mockMvc.perform(post("/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_deveRetornar400_quandoSenhaCurta() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        String email = TestDataFactory.uniqueEmail();
        CreateUserRequest createRequest = TestDataFactory.createUserRequest(email, "USER");

        String createBody = mockMvc.perform(post("/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long id = objectMapper.readTree(createBody).get("id").asLong();

        UpdateUserRequest updateRequest = new UpdateUserRequest("Novo Nome", email, "curta", "USER");

        mockMvc.perform(put("/users/" + id)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_deveRetornar200_quandoPasswordAusente() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "ADMIN");
        String email = TestDataFactory.uniqueEmail();
        CreateUserRequest createRequest = TestDataFactory.createUserRequest(email, "USER");

        String createBody = mockMvc.perform(post("/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long id = objectMapper.readTree(createBody).get("id").asLong();

        // password null = mantém a senha atual — @Size ignora null, não valida.
        UpdateUserRequest updateRequest = new UpdateUserRequest("Novo Nome", email, null, "USER");

        mockMvc.perform(put("/users/" + id)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk());
    }
}
