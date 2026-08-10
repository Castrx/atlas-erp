package com.atlas.backend.dto.stock;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StockMovementRequest(

        @NotNull
        Long productId,

        @NotNull
        @Min(1)
        Integer quantity,

        @NotBlank
        String reason

) {
}