package com.atlas.backend.dto.sale;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SaleRequest(

        @NotNull(message = "Cliente é obrigatório.")
        Long customerId,

        @Valid
        @NotEmpty(message = "A venda deve possuir pelo menos um item.")
        List<SaleItemRequest> items

) {
}