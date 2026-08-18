package com.atlas.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuração do rate limiting de {@code POST /auth/login} (mitigação de
 * força bruta — ver {@code LoginRateLimiter}/{@code LoginRateLimitFilter}).
 * Contador em memória por IP, sem infraestrutura externa (Redis etc.) —
 * adequado a uma instância única do backend, como o projeto roda hoje.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "rate-limit.login")
public class RateLimitProperties {

    private int maxAttempts;

    private long windowSeconds;

}
