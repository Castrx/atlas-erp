package com.atlas.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Rate limiting de {@code POST /auth/login} por IP — mitigação de força
 * bruta (P1 do fechamento do MVP; ver {@link LoginRateLimiter} para a
 * lógica de janela/contagem). Não interfere em nenhuma outra rota:
 * qualquer requisição que não seja exatamente {@code POST /auth/login}
 * segue direto para o próximo filtro, sem consultar o limiter.
 *
 * <p>IP obtido via {@code request.getRemoteAddr()} — suficiente para o
 * deploy atual (acesso direto em dev, ou via proxy reverso na mesma rede
 * do docker-compose). Atrás de um proxy/load balancer que não preserva o
 * IP original do cliente (sem {@code X-Forwarded-For} confiável), todas as
 * requisições seriam vistas com o IP do proxy — fora de escopo aqui, ver
 * ressalva no relatório desta etapa.
 */
@Component
@RequiredArgsConstructor
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final String LOGIN_PATH = "/auth/login";

    private final LoginRateLimiter loginRateLimiter;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        if (!isLoginRequest(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!loginRateLimiter.tryConsume(request.getRemoteAddr())) {

            // Mensagem fixa e genérica — mesmo padrão do authenticationEntryPoint
            // em SecurityConfig: não expõe contador, janela nem qualquer outro
            // detalhe interno do limiter ao cliente.
            response.sendError(
                    HttpStatus.TOO_MANY_REQUESTS.value(),
                    "Muitas tentativas de login. Tente novamente em instantes."
            );

            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isLoginRequest(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod())
                && LOGIN_PATH.equals(request.getRequestURI());
    }

}
