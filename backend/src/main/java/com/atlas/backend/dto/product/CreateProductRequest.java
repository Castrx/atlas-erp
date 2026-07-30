package com.atlas.backend.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateProductRequest(

        @NotBlank
        String name,

        String description,

        @NotBlank
        String sku,

        String barcode,

        @NotNull
        @DecimalMin("0.00")
        BigDecimal costPrice,

        @NotNull
        @DecimalMin("0.00")
        BigDecimal salePrice,

        Integer stock,

        Integer minimumStock,

        @NotNull
        Long categoryId

) {
}