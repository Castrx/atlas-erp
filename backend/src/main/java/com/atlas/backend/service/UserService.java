package com.atlas.backend.service;

import com.atlas.backend.dto.user.CreateUserRequest;
import com.atlas.backend.dto.user.UpdateUserRequest;
import com.atlas.backend.dto.user.UserResponse;
import com.atlas.backend.entity.Role;
import com.atlas.backend.entity.User;
import com.atlas.backend.exception.BusinessException;
import com.atlas.backend.exception.ResourceNotFoundException;
import com.atlas.backend.mapper.UserMapper;
import com.atlas.backend.repository.RoleRepository;
import com.atlas.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public UserResponse create(CreateUserRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("Já existe um usuário com este e-mail.");
        }

        Role role = roleRepository.findByName(request.role())
                .orElseThrow(() ->
                        new BusinessException("Perfil não encontrado."));

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .roles(Set.of(role))
                .build();

        userRepository.save(user);

        return userMapper.toResponse(user);
    }

    public List<UserResponse> findAll() {

        return userRepository.findAll()
                .stream()
                .map(userMapper::toResponse)
                .toList();
    }

    public UserResponse findById(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Usuário não encontrado."));

        return userMapper.toResponse(user);
    }

    public UserResponse update(Long id, UpdateUserRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Usuário não encontrado."));

        if (!user.getEmail().equals(request.email())
                && userRepository.existsByEmail(request.email())) {

            throw new BusinessException("Já existe um usuário com este e-mail.");
        }

        Role role = roleRepository.findByName(request.role())
                .orElseThrow(() ->
                        new BusinessException("Perfil não encontrado."));

        user.setName(request.name());
        user.setEmail(request.email());

        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        user.setRoles(Set.of(role));

        userRepository.save(user);

        return userMapper.toResponse(user);
    }

    public void delete(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Usuário não encontrado."));

        userRepository.delete(user);
    }

}