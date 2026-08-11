package com.atlas.backend.unit.security;

import com.atlas.backend.config.JwtProperties;
import com.atlas.backend.entity.Role;
import com.atlas.backend.entity.User;
import com.atlas.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Teste unitário puro — sem contexto Spring, sem banco. JwtService só
 * depende de JwtProperties (POJO simples), então é rápido e não exige
 * nenhuma infraestrutura.
 */
class JwtServiceTest {

    private static final String SECRET =
            "chave-de-teste-com-tamanho-minimo-exigido-pelo-algoritmo-hs256";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(propertiesWith(SECRET, 3_600_000L));
    }

    private JwtProperties propertiesWith(String secret, long expiration) {
        JwtProperties properties = new JwtProperties();
        properties.setSecret(secret);
        properties.setExpiration(expiration);
        return properties;
    }

    private User userWithRoles(String... roleNames) {
        Set<Role> roles = new HashSet<>();
        for (String roleName : roleNames) {
            roles.add(Role.builder().name(roleName).build());
        }

        return User.builder()
                .email("usuario@teste.local")
                .roles(roles)
                .build();
    }

    @Test
    void generateToken_deveGerarTokenComEmailComoSubject() {
        String token = jwtService.generateToken(userWithRoles("ADMIN"));

        assertThat(jwtService.extractUsername(token)).isEqualTo("usuario@teste.local");
    }

    @Test
    void generateToken_deveIncluirTodosOsPapeisComoClaim() {
        String token = jwtService.generateToken(userWithRoles("ADMIN", "USER"));

        assertThat(jwtService.extractRoles(token)).containsExactlyInAnyOrder("ADMIN", "USER");
    }

    @Test
    void isTokenValid_deveRetornarTrue_paraTokenRecemGerado() {
        String token = jwtService.generateToken(userWithRoles("USER"));

        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_deveRetornarFalse_paraTokenMalformado() {
        assertThat(jwtService.isTokenValid("token.invalido.aqui")).isFalse();
    }

    @Test
    void isTokenValid_deveRetornarFalse_paraTokenAssinadoComOutraChave() {
        JwtService outroServico = new JwtService(
                propertiesWith("outra-chave-completamente-diferente-para-o-teste-de-assinatura", 3_600_000L));

        String tokenComOutraChave = outroServico.generateToken(userWithRoles("USER"));

        assertThat(jwtService.isTokenValid(tokenComOutraChave)).isFalse();
    }

    @Test
    void isTokenValid_deveRetornarFalse_paraTokenJaExpirado() {
        JwtService servicoComExpiracaoNoPassado = new JwtService(propertiesWith(SECRET, -1000L));

        String tokenJaExpirado = servicoComExpiracaoNoPassado.generateToken(userWithRoles("USER"));

        assertThat(jwtService.isTokenValid(tokenJaExpirado)).isFalse();
    }
}
