package com.atlas.backend.dto.company;

public record CompanyResponse(
        Long id,
        String corporateName,
        String tradeName,
        String cnpj,
        String email,
        String phone,
        Boolean active
) {
}