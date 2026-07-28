package com.atlas.backend.dto.company;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateCompanyRequest(

        @NotBlank
        String corporateName,

        @NotBlank
        String tradeName,

        @NotBlank
        @Pattern(regexp = "\\d{14}")
        String cnpj,

        @Email
        String email,

        String phone

) {}