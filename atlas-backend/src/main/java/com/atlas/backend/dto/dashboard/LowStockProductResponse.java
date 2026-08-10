package com.atlas.backend.dto.dashboard;

public record LowStockProductResponse(

        Long id,
        String name,
        String sku,
        Integer stock,
        Integer minimumStock

) {
}
