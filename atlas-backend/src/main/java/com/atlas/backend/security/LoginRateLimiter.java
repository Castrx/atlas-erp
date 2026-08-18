package com.atlas.backend.security;

import com.atlas.backend.config.RateLimitProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limiter em memória, por chave (tipicamente o IP remoto), janela
 * fixa — mitigação de força bruta em {@code POST /auth/login} (ver
 * {@link LoginRateLimitFilter}) sem depender de infraestrutura externa
 * (Redis etc.). Adequado a uma única instância do backend, como o projeto
 * roda hoje; múltiplas instâncias atrás de um load balancer exigiriam um
 * contador compartilhado entre processos — fora de escopo aqui.
 *
 * <p>Janela fixa (não deslizante): a contagem de uma chave zera por
 * completo quando passa o tempo configurado desde o início da janela
 * atual — mais simples que uma janela deslizante, e suficiente para achatar
 * rajadas de força bruta (não é uma garantia matemática exata de "N
 * tentativas em qualquer intervalo de T segundos", que uma janela
 * deslizante daria com mais complexidade).
 *
 * <p>Não faz limpeza periódica de chaves antigas — o mapa cresce com o
 * número de IPs distintos que já tentaram logar desde a última subida do
 * processo. Aceitável no estágio atual do projeto; um cache com expiração
 * (ex.: Caffeine) seria o próximo passo natural se isso virar um problema
 * real de memória.
 */
@Component
public class LoginRateLimiter {

    private final RateLimitProperties properties;
    private final Clock clock;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    @Autowired
    public LoginRateLimiter(RateLimitProperties properties) {
        this(properties, Clock.systemUTC());
    }

    /**
     * Construtor com {@link Clock} explícito — usado pelos testes para
     * controlar o avanço do tempo de forma determinística (sem
     * {@code Thread.sleep}). Não é o construtor usado pela injeção de
     * dependência do Spring (ver construtor de um argumento, anotado
     * {@code @Autowired}).
     */
    public LoginRateLimiter(RateLimitProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    /**
     * Tenta consumir uma tentativa para a chave informada. Retorna
     * {@code true} se a tentativa é permitida (dentro do limite da janela
     * atual — o chamador deve prosseguir), {@code false} se deve ser
     * bloqueada (o chamador deve responder 429).
     */
    public boolean tryConsume(String key) {

        long now = clock.instant().getEpochSecond();

        Window window = windows.compute(key, (ignoredKey, existing) -> {

            if (existing == null || now - existing.windowStart() >= properties.getWindowSeconds()) {
                return new Window(now, new AtomicInteger(1));
            }

            existing.count().incrementAndGet();

            return existing;
        });

        return window.count().get() <= properties.getMaxAttempts();
    }

    private record Window(long windowStart, AtomicInteger count) {
    }

}
