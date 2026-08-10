package com.atlas.backend.dto.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerRequest(

        @NotBlank(message = "Nome é obrigatório.")
        @Size(max = 150)
        String name,

        @Email(message = "E-mail inválido.")
        @Size(max = 150)
        String email,

        @Size(max = 20)
        String phone,

        @NotBlank(message = "Documento é obrigatório.")
        @Size(max = 20)
        String document

) {
}