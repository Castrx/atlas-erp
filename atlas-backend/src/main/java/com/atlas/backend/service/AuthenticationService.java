package com.atlas.backend.service;

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
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    public static final String SELF_REGISTER_ROLE = "USER";

    public UserResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("Já existe um usuário com este e-mail.");
        }

        // Auto-registro público sempre cria USER - o cliente não escolhe
        // nem promove a ADMIN por aqui, mesmo enviando outro valor em
        // request.role() (o campo é aceito mas ignorado, de propósito).
        // Criar/promover ADMIN é uma ação administrativa (POST /users,
        // ADMIN-only), nunca parte do fluxo público de registro.
        Role role = roleRepository.findByName(SELF_REGISTER_ROLE)
                .orElseThrow(() ->
                        new BusinessException("Perfil padrão não encontrado."));

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .roles(Set.of(role))
                .build();

        userRepository.save(user);

        return userMapper.toResponse(user);
    }

    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() ->
                        new BadCredentialsException("E-mail ou senha inválidos."));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadCredentialsException("E-mail ou senha inválidos.");
        }

        String token = jwtService.generateToken(user);

        return new LoginResponse(token);
    }

}