package com.atlas.backend.dto.sale;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SaleResponse(

        Long id,

        Long customerId,

        String customerName,

        BigDecimal total,

        String createdBy,

        LocalDateTime createdAt,

        List<SaleItemResponse> items

) {
}