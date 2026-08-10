package com.atlas.backend.dto.customer;

import java.time.LocalDateTime;

public record CustomerResponse(

        Long id,
        String name,
        String email,
        String phone,
        String document,
        Boolean active,
        LocalDateTime createdAt

) {
}