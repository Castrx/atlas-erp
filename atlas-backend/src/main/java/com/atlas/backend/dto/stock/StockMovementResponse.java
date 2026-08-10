package com.atlas.backend.dto.stock;

import com.atlas.backend.entity.MovementType;

import java.time.LocalDateTime;

public record StockMovementResponse(

        Long id,

        Long productId,

        String productName,

        MovementType type,

        Integer quantity,

        String reason,

        String createdBy,

        LocalDateTime createdAt

) {
}