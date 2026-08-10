package com.atlas.backend.dto.sale;

import java.math.BigDecimal;

public record SaleItemResponse(

        Long productId,

        String productName,

        Integer quantity,

        BigDecimal unitPrice,

        BigDecimal subtotal

) {
}