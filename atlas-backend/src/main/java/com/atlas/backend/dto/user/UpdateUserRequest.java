package com.atlas.backend.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(

        @NotBlank(message = "O nome é obrigatório.")
        String name,

        @Email(message = "E-mail inválido.")
        @NotBlank(message = "O e-mail é obrigatório.")
        String email,

        // Opcional (null = mantém a senha atual); @Size ignora null, então só
        // valida quando uma nova senha é informada.
        @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres.")
        String password,

        @NotBlank(message = "O perfil é obrigatório.")
        String role

) {
}