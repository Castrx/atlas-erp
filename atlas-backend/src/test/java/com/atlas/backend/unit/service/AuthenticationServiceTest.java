package com.atlas.backend.unit.service;

import com.atlas.backend.dto.auth.LoginRequest;
import com.atlas.backend.dto.auth.LoginResponse;
import com.atlas.backend.dto.auth.RegisterRequest;
import com.atlas.backend.dto.user.UserResponse;
import com.atlas.backend.entity.Role;
import com.atlas.backend.entity.User;
import com.atlas.backend.exception.BusinessException;
import com.atlas.backend.mapper.UserMapper;
import com.atlas.backend.repository.RoleRepository;
import com.atlas.backend.repository.UserRepository;
import com.atlas.backend.security.JwtService;
import com.atlas.backend.service.AuthenticationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários com Mockito — repositórios e colaboradores mockados,
 * sem Spring context, sem banco. Cobre as regras de negócio reais do
 * fluxo de autenticação: e-mail duplicado no registro, perfil inexistente,
 * senha codificada antes de persistir, e as duas causas de credenciais
 * inválidas no login.
 */
@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private AuthenticationService authenticationService;

    @Test
    void register_deveLancarBusinessException_quandoEmailJaExiste() {
        RegisterRequest request = new RegisterRequest("Nome", "existente@teste.local", "senha123", "USER");

        when(userRepository.existsByEmail("existente@teste.local")).thenReturn(true);

        assertThatThrownBy(() -> authenticationService.register(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Já existe um usuário com este e-mail.");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_deveIgnorarRoleDoRequestEBuscarSempreUSER_mesmoTentandoADMIN() {
        // RBAC (Sprint 7A): auto-registro público nunca deve criar ADMIN,
        // mesmo que o cliente envie role="ADMIN" no corpo da requisição.
        RegisterRequest request = new RegisterRequest("Nome", "novo@teste.local", "senha123", "ADMIN");
        Role roleUser = Role.builder().id(2L).name("USER").build();

        when(userRepository.existsByEmail("novo@teste.local")).thenReturn(false);
        when(roleRepository.findByName("USER")).thenReturn(Optional.of(roleUser));
        when(passwordEncoder.encode("senha123")).thenReturn("senha-codificada");
        when(userMapper.toResponse(any(User.class)))
                .thenReturn(UserResponse.builder().id(1L).name("Nome").email("novo@teste.local").build());

        authenticationService.register(request);

        // Nunca deve consultar a role "ADMIN" enviada no request - só "USER".
        verify(roleRepository, never()).findByName("ADMIN");
        verify(userRepository).save(argThat((User user) ->
                user.getRoles().size() == 1 && user.getRoles().contains(roleUser)));
    }

    @Test
    void register_devePersistirSenhaCodificada_quandoDadosValidos() {
        RegisterRequest request = new RegisterRequest("Nome", "novo@teste.local", "senha123", "USER");
        Role role = Role.builder().id(1L).name("USER").build();

        when(userRepository.existsByEmail("novo@teste.local")).thenReturn(false);
        when(roleRepository.findByName("USER")).thenReturn(Optional.of(role));
        when(passwordEncoder.encode("senha123")).thenReturn("senha-codificada");
        when(userMapper.toResponse(any(User.class)))
                .thenReturn(UserResponse.builder().id(1L).name("Nome").email("novo@teste.local").build());

        UserResponse response = authenticationService.register(request);

        assertThat(response.getEmail()).isEqualTo("novo@teste.local");

        verify(userRepository).save(argThat((User user) ->
                user.getPassword().equals("senha-codificada") && user.getRoles().contains(role)));
    }

    @Test
    void login_deveLancarBadCredentials_quandoEmailNaoExiste() {
        LoginRequest request = new LoginRequest("inexistente@teste.local", "qualquer123");

        when(userRepository.findByEmail("inexistente@teste.local")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authenticationService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("E-mail ou senha inválidos.");
    }

    @Test
    void login_deveLancarBadCredentials_quandoSenhaIncorreta() {
        LoginRequest request = new LoginRequest("usuario@teste.local", "senhaErrada");
        User user = User.builder()
                .email("usuario@teste.local")
                .password("hash-correto")
                .roles(Set.of())
                .build();

        when(userRepository.findByEmail("usuario@teste.local")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("senhaErrada", "hash-correto")).thenReturn(false);

        assertThatThrownBy(() -> authenticationService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("E-mail ou senha inválidos.");
    }

    @Test
    void login_deveRetornarToken_quandoCredenciaisCorretas() {
        LoginRequest request = new LoginRequest("usuario@teste.local", "senhaCorreta");
        User user = User.builder()
                .email("usuario@teste.local")
                .password("hash-correto")
                .roles(Set.of())
                .build();

        when(userRepository.findByEmail("usuario@teste.local")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("senhaCorreta", "hash-correto")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("token-gerado");

        LoginResponse response = authenticationService.login(request);

        assertThat(response.token()).isEqualTo("token-gerado");
    }
}
