package com.atlas.backend.integration;

import com.atlas.backend.dto.auth.LoginRequest;
import com.atlas.backend.dto.auth.RegisterRequest;
import com.atlas.backend.entity.Role;
import com.atlas.backend.entity.User;
import com.atlas.backend.support.AbstractIntegrationTest;
import com.atlas.backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de integração de ponta a ponta: controller real, security real,
 * banco real (Postgres efêmero via Testcontainers). Cobre exatamente o
 * fluxo já validado manualmente na Sprint 1B — registro, login, e o
 * comportamento das rotas públicas vs. protegidas.
 */
class AuthControllerIT extends AbstractIntegrationTest {

    @Test
    void register_deveRetornar201_comUsuarioValido() throws Exception {
        String email = TestDataFactory.uniqueEmail();
        RegisterRequest request = TestDataFactory.registerRequest(email, "USER");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.id", notNullValue()));
    }

    @Test
    void register_deveRetornar409_quandoEmailJaCadastrado() throws Exception {
        String email = TestDataFactory.uniqueEmail();
        RegisterRequest request = TestDataFactory.registerRequest(email, "USER");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Não foi possível concluir o registro. Verifique os dados e tente novamente."));
    }

    @Test
    void register_deveRetornar400_quandoSenhaCurta() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Usuário de Teste", TestDataFactory.uniqueEmail(), "curta", "USER");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_deveRetornar401_quandoSenhaCurta() throws Exception {
        // A política mínima não se aplica ao login: senha curta deve dar 401
        // (credenciais inválidas), nunca 400 (validação de corpo).
        LoginRequest request = new LoginRequest(TestDataFactory.uniqueEmail(), "curta");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void register_deveIgnorarTentativaDeRoleADMIN_eCriarUsuarioComoUSER() throws Exception {
        // RBAC (Sprint 7A): auto-registro público nunca deve criar ADMIN,
        // mesmo que o cliente peça explicitamente role="ADMIN".
        String email = TestDataFactory.uniqueEmail();
        RegisterRequest request = TestDataFactory.registerRequest(email, "ADMIN");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Confirma direto no banco: o usuário criado tem só a role USER.
        User user = userRepository.findByEmail(email).orElseThrow();
        assertThat(user.getRoles()).extracting(Role::getName).containsExactly("USER");

        // Confirma pelo comportamento observável: o token desse usuário
        // não tem acesso a um endpoint ADMIN-only.
        LoginRequest loginRequest = TestDataFactory.loginRequest(email, TestDataFactory.DEFAULT_PASSWORD);

        String responseBody = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = objectMapper.readTree(responseBody).get("token").asText();

        mockMvc.perform(get("/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void login_deveRetornarTokenValido_quandoCredenciaisCorretas() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");

        assertThat(token).isNotBlank();
    }

    @Test
    void login_deveRetornar401_quandoSenhaIncorreta() throws Exception {
        String email = TestDataFactory.uniqueEmail();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(TestDataFactory.registerRequest(email, "USER"))))
                .andExpect(status().isCreated());

        LoginRequest loginComSenhaErrada = new LoginRequest(email, "senhaCompletamenteErrada");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginComSenhaErrada)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("E-mail ou senha inválidos."));
    }

    @Test
    void login_deveRetornar401_quandoEmailNaoCadastrado() throws Exception {
        LoginRequest request = new LoginRequest(TestDataFactory.uniqueEmail(), "qualquerSenha123");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rotaProtegida_deveRetornar401_semToken() throws Exception {
        mockMvc.perform(get("/products"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rotaProtegida_deveRetornar401_semVazarMensagemInternaDoFramework() throws Exception {
        String responseBody = mockMvc.perform(get("/products"))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // O entry point usa texto fixo/genérico — a mensagem do framework
        // ("Full authentication is required...") não pode vazar no corpo.
        assertThat(responseBody).doesNotContain("authentication");
    }

    @Test
    void rotaProtegida_deveRetornar200_comTokenValido() throws Exception {
        String token = registerAndLogin(TestDataFactory.uniqueEmail(), "USER");

        mockMvc.perform(get("/products")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}
