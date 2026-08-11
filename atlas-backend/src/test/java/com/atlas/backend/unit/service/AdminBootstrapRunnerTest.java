package com.atlas.backend.unit.service;

import com.atlas.backend.config.AdminBootstrapRunner;
import com.atlas.backend.entity.Role;
import com.atlas.backend.entity.User;
import com.atlas.backend.repository.RoleRepository;
import com.atlas.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários do {@link AdminBootstrapRunner} (AE-045) — Mockito puro,
 * sem Spring context, sem banco. Cobrem os três comportamentos contratados:
 * inerte sem variáveis de bootstrap, criação do ADMIN com variáveis, e
 * idempotência quando o e-mail já existe.
 */
@ExtendWith(MockitoExtension.class)
class AdminBootstrapRunnerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AdminBootstrapRunner runner(String email, String password, String name) {
        return new AdminBootstrapRunner(
                userRepository, roleRepository, passwordEncoder, email, password, name);
    }

    @Test
    void run_deveSerInerte_quandoVariaveisNaoDefinidas() {
        AdminBootstrapRunner runner = runner("", "", "Administrador");

        runner.run(new DefaultApplicationArguments(new String[0]));

        verify(userRepository, never()).existsByEmail(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void run_deveCriarAdminComRoleAdministrador_quandoVariaveisDefinidas() {
        Role adminRole = Role.builder().id(1L).name("ADMIN").build();

        when(userRepository.existsByEmail("admin@example.com")).thenReturn(false);
        when(roleRepository.findByName("ADMIN")).thenReturn(Optional.of(adminRole));
        when(passwordEncoder.encode("senha-forte")).thenReturn("hash-bcrypt");

        AdminBootstrapRunner runner = runner("admin@example.com", "senha-forte", "Administrador");
        runner.run(new DefaultApplicationArguments(new String[0]));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());

        User saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("admin@example.com");
        assertThat(saved.getName()).isEqualTo("Administrador");
        assertThat(saved.getPassword()).isEqualTo("hash-bcrypt");
        assertThat(saved.getRoles()).extracting(Role::getName).containsExactly("ADMIN");
    }

    @Test
    void run_deveSerIdempotente_quandoEmailJaExiste() {
        when(userRepository.existsByEmail("admin@example.com")).thenReturn(true);

        AdminBootstrapRunner runner = runner("admin@example.com", "senha-forte", "Administrador");
        runner.run(new DefaultApplicationArguments(new String[0]));

        verify(roleRepository, never()).findByName(any());
        verify(userRepository, never()).save(any());
    }
}
