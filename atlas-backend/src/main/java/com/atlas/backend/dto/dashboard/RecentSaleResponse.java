package com.atlas.backend.dto.dashboard;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RecentSaleResponse(

        Long id,
        String customerName,
        BigDecimal total,
        LocalDateTime createdAt

) {
}
