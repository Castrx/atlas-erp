package com.atlas.backend.dto.sale;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SaleItemRequest(

        @NotNull(message = "Produto é obrigatório.")
        Long productId,

        @NotNull(message = "Quantidade é obrigatória.")
        @Min(value = 1, message = "Quantidade deve ser maior que zero.")
        Integer quantity

) {
}