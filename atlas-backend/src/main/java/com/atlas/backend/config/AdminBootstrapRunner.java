package com.atlas.backend.config;

import com.atlas.backend.entity.Role;
import com.atlas.backend.entity.User;
import com.atlas.backend.repository.RoleRepository;
import com.atlas.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Set;

/**
 * Provisiona o primeiro usuário ADMIN de uma instalação nova (AE-045).
 *
 * <p>Desde a Sprint 7A (RBAC), {@code POST /auth/register} sempre cria USER
 * e {@code POST /users} é ADMIN-only — não há caminho público nem
 * administrativo para criar o primeiro ADMIN. Este runner fecha esse buraco
 * de forma deliberadamente restrita:
 *
 * <ul>
 *   <li>Só age quando {@code ADMIN_BOOTSTRAP_EMAIL} e {@code
 *       ADMIN_BOOTSTRAP_PASSWORD} estiverem definidas — sem elas é
 *       completamente inerte (nada de usuário é criado);</li>
 *   <li>Idempotente: se já existir usuário com o e-mail informado, não faz
 *       nada (nem altera papéis existentes);</li>
 *   <li>Cria o ADMIN via repositório com o mesmo padrão de
 *       {@code UserService}/{@code AuthenticationService} — bcrypt via
 *       {@code PasswordEncoder} e papel {@code ADMIN} persistido na tabela
 *       {@code user_roles}.</li>
 * </ul>
 *
 * <p>Recomendação: remova as variáveis após criar o primeiro ADMIN para não
 * deixar um caminho de provisionamento ativo.
 */
@Component
@Slf4j
public class AdminBootstrapRunner implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    private final String email;
    private final String password;
    private final String name;

    public AdminBootstrapRunner(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            @Value("${admin.bootstrap.email:}") String email,
            @Value("${admin.bootstrap.password:}") String password,
            @Value("${admin.bootstrap.name:Administrador}") String name) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
        this.name = name;
    }

    @Override
    public void run(ApplicationArguments args) {

        if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
            log.debug("Bootstrap de ADMIN desativado (defina ADMIN_BOOTSTRAP_EMAIL e ADMIN_BOOTSTRAP_PASSWORD para ativá-lo).");
            return;
        }

        if (userRepository.existsByEmail(email)) {
            log.info("Bootstrap de ADMIN: usuário {} já existe — nenhuma ação.", email);
            return;
        }

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException(
                        "Role ADMIN não encontrada — migration V8 não rodou?"));

        User admin = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .roles(Set.of(adminRole))
                .build();

        userRepository.save(admin);

        log.info("Primeiro ADMIN criado via bootstrap: {}", email);
    }
}
