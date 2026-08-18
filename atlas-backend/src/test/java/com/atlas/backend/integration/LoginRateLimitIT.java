package com.atlas.backend.integration;

import com.atlas.backend.config.RateLimitProperties;
import com.atlas.backend.support.AbstractIntegrationTest;
import com.atlas.backend.support.TestDataFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Rate limiting de {@code POST /auth/login} ponta a ponta (controller +
 * security real + filtro real) — ver {@code LoginRateLimiter}/
 * {@code LoginRateLimitFilter}.
 *
 * <p>O contexto Spring (e o bean {@link RateLimitProperties}, singleton) é
 * compartilhado com o resto da suíte de integração, com um default bem
 * permissivo (ver {@code AbstractIntegrationTest}) para não interferir em
 * nenhum outro teste. Aqui, cada método aperta esse valor pontualmente no
 * {@code @BeforeEach} e restaura no {@code @AfterEach} — como os testes de
 * uma classe rodam sequencialmente na mesma JVM (sem paralelismo
 * configurado no projeto), isso é seguro.
 *
 * <p>Cada método usa um IP fake exclusivo (via {@link RequestPostProcessor}
 * sobre {@code MockHttpServletRequest}) para não interferir uns com os
 * outros nem com o resto da suíte, que sempre bate em {@code /auth/login}
 * como {@code 127.0.0.1} (comportamento padrão do MockMvc).
 */
class LoginRateLimitIT extends AbstractIntegrationTest {

    @Autowired
    private RateLimitProperties rateLimitProperties;

    private int originalMaxAttempts;
    private long originalWindowSeconds;

    @BeforeEach
    void tightenRateLimit() {
        originalMaxAttempts = rateLimitProperties.getMaxAttempts();
        originalWindowSeconds = rateLimitProperties.getWindowSeconds();

        rateLimitProperties.setMaxAttempts(3);
        rateLimitProperties.setWindowSeconds(60);
    }

    @AfterEach
    void restoreRateLimit() {
        rateLimitProperties.setMaxAttempts(originalMaxAttempts);
        rateLimitProperties.setWindowSeconds(originalWindowSeconds);
    }

    private RequestPostProcessor fromIp(String ip) {
        return request -> {
            request.setRemoteAddr(ip);
            return request;
        };
    }

    private String loginPayload(String email, String password) throws Exception {
        return objectMapper.writeValueAsString(TestDataFactory.loginRequest(email, password));
    }

    @Test
    void login_deveFuncionarNormalmente_dentroDoLimite() throws Exception {
        String email = TestDataFactory.uniqueEmail();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                TestDataFactory.registerRequest(email, "USER"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/auth/login")
                        .with(fromIp("203.0.113.101"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload(email, TestDataFactory.DEFAULT_PASSWORD)))
                .andExpect(status().isOk());
    }

    @Test
    void login_devePermitirMultiplasTentativas_dentroDoLimite() throws Exception {
        String ip = "203.0.113.102";

        // 3 tentativas com credenciais erradas — todas dentro do limite (3):
        // nenhuma deve ser barrada pelo rate limiter (401 de credenciais
        // inválidas, nunca 429).
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/auth/login")
                            .with(fromIp(ip))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginPayload(TestDataFactory.uniqueEmail(), "senhaErrada123")))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Test
    void login_deveRetornar429_aposExcederOLimite() throws Exception {
        String ip = "203.0.113.103";

        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/auth/login")
                            .with(fromIp(ip))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginPayload(TestDataFactory.uniqueEmail(), "senhaErrada123")))
                    .andExpect(status().isUnauthorized());
        }

        // 4ª tentativa na mesma janela: barrada pelo rate limiter, nem chega
        // a validar credenciais.
        mockMvc.perform(post("/auth/login")
                        .with(fromIp(ip))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload(TestDataFactory.uniqueEmail(), "senhaErrada123")))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void login_naoDeveVazarDetalheInterno_noBloqueio429() throws Exception {
        String ip = "203.0.113.104";

        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/auth/login")
                    .with(fromIp(ip))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(loginPayload(TestDataFactory.uniqueEmail(), "senhaErrada123")));
        }

        String body = mockMvc.perform(post("/auth/login")
                        .with(fromIp(ip))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload(TestDataFactory.uniqueEmail(), "senhaErrada123")))
                .andExpect(status().isTooManyRequests())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(body).doesNotContain("RateLimit", "ConcurrentHashMap", "windowStart", "LoginRateLimiter");
    }

    @Test
    void login_devePermitirNovamente_aposAJanelaExpirar() throws Exception {
        String ip = "203.0.113.105";

        // Janela curta (1s) só para este teste — permite validar a
        // expiração de forma determinística com uma espera mínima, sem
        // depender do valor de produção (60s).
        rateLimitProperties.setWindowSeconds(1);

        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/auth/login")
                    .with(fromIp(ip))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(loginPayload(TestDataFactory.uniqueEmail(), "senhaErrada123")));
        }

        mockMvc.perform(post("/auth/login")
                        .with(fromIp(ip))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload(TestDataFactory.uniqueEmail(), "senhaErrada123")))
                .andExpect(status().isTooManyRequests());

        Thread.sleep(1100);

        // Nova janela: volta a validar credenciais normalmente (401 de
        // credenciais inválidas, não mais 429).
        mockMvc.perform(post("/auth/login")
                        .with(fromIp(ip))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload(TestDataFactory.uniqueEmail(), "senhaErrada123")))
                .andExpect(status().isUnauthorized());
    }

}
