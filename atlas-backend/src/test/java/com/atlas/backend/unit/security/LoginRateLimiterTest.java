package com.atlas.backend.unit.security;

import com.atlas.backend.config.RateLimitProperties;
import com.atlas.backend.security.LoginRateLimiter;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Testes unitários puros (sem Spring context, sem banco) do rate limiter de
 * login — janela fixa, em memória, por chave. Um {@link Clock} mutável é
 * injetado para controlar o avanço do tempo com precisão, sem depender de
 * {@code Thread.sleep} (determinístico e rápido).
 */
class LoginRateLimiterTest {

    private final MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);

    private LoginRateLimiter newLimiter(int maxAttempts, long windowSeconds) {

        RateLimitProperties properties = new RateLimitProperties();
        properties.setMaxAttempts(maxAttempts);
        properties.setWindowSeconds(windowSeconds);

        return new LoginRateLimiter(properties, clock);
    }

    @Test
    void tryConsume_devePermitir_umaUnicaTentativa() {
        LoginRateLimiter limiter = newLimiter(5, 60);

        assertThat(limiter.tryConsume("203.0.113.10")).isTrue();
    }

    @Test
    void tryConsume_devePermitir_multiplasTentativasDentroDoLimite() {
        LoginRateLimiter limiter = newLimiter(5, 60);

        for (int i = 0; i < 5; i++) {
            assertThat(limiter.tryConsume("203.0.113.11")).isTrue();
        }
    }

    @Test
    void tryConsume_deveBloquear_aposExcederOLimite() {
        LoginRateLimiter limiter = newLimiter(3, 60);

        assertThat(limiter.tryConsume("203.0.113.12")).isTrue();
        assertThat(limiter.tryConsume("203.0.113.12")).isTrue();
        assertThat(limiter.tryConsume("203.0.113.12")).isTrue();

        // 4ª tentativa dentro da mesma janela: bloqueada.
        assertThat(limiter.tryConsume("203.0.113.12")).isFalse();
        // Continua bloqueada em tentativas seguintes, ainda dentro da janela.
        assertThat(limiter.tryConsume("203.0.113.12")).isFalse();
    }

    @Test
    void tryConsume_deveIsolarPorChave_ipsDiferentesNaoInterferem() {
        LoginRateLimiter limiter = newLimiter(1, 60);

        assertThat(limiter.tryConsume("203.0.113.13")).isTrue();
        assertThat(limiter.tryConsume("203.0.113.13")).isFalse();

        // IP diferente, mesmo limiter: tem seu próprio orçamento.
        assertThat(limiter.tryConsume("203.0.113.14")).isTrue();
    }

    @Test
    void tryConsume_devePermitirNovamente_aposAJanelaExpirar() {
        LoginRateLimiter limiter = newLimiter(2, 10);

        assertThat(limiter.tryConsume("203.0.113.15")).isTrue();
        assertThat(limiter.tryConsume("203.0.113.15")).isTrue();
        assertThat(limiter.tryConsume("203.0.113.15")).isFalse();

        // Avança o relógio para além da janela (10s) — nova janela, contagem zera.
        clock.advance(Duration.ofSeconds(11));

        assertThat(limiter.tryConsume("203.0.113.15")).isTrue();
    }

    @Test
    void tryConsume_naoDeveResetar_antesDaJanelaExpirar() {
        LoginRateLimiter limiter = newLimiter(1, 10);

        assertThat(limiter.tryConsume("203.0.113.16")).isTrue();

        clock.advance(Duration.ofSeconds(9));

        assertThat(limiter.tryConsume("203.0.113.16")).isFalse();
    }

    /** Clock mutável — permite avançar o tempo manualmente e de forma determinística nos testes. */
    private static final class MutableClock extends Clock {

        private Instant instant;
        private final ZoneId zone;

        MutableClock(Instant instant, ZoneId zone) {
            this.instant = instant;
            this.zone = zone;
        }

        void advance(Duration duration) {
            instant = instant.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return zone;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return new MutableClock(instant, zone);
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
