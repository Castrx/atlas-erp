package com.atlas.backend.dto.category;

public record CategoryResponse(

        Long id,
        String name,
        String description,
        Boolean active

) {
}