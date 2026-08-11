package com.atlas.backend.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdateProductRequest(

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

        // stock intencionalmente AUSENTE no update (Sprint Security & Data
        // Integrity / M4): estoque só muda pelos fluxos de estoque
        // (StockService, venda, cancelamento) — nunca pelo PUT de produto.
        // Isso preserva o StockMovement como trilha de auditoria.
        @Min(0)
        Integer minimumStock,

        @NotNull
        Long categoryId

) {
}