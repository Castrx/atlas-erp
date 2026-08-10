package com.atlas.backend.dto.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyRevenueResponse(

        LocalDate date,
        BigDecimal total

) {
}
