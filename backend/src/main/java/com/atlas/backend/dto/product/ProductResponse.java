package com.atlas.backend.dto.product;

import java.math.BigDecimal;

public record ProductResponse(

        Long id,
        String name,
        String description,
        String sku,
        String barcode,
        BigDecimal costPrice,
        BigDecimal salePrice,
        Integer stock,
        Integer minimumStock,
        Boolean active,
        Long categoryId,
        String categoryName

) {
}