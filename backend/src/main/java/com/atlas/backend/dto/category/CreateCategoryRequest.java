package com.atlas.backend.dto.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(

        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 100)
        String name,

        @Size(max = 255)
        String description

) {
}