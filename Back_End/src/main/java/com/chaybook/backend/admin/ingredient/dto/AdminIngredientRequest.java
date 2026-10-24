package com.chaybook.backend.admin.ingredient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminIngredientRequest(
        @NotBlank(message = "Ingredient name is required")
        @Size(max = 255, message = "Ingredient name must not exceed 255 characters")
        String name,

        @Size(max = 5000, message = "Description must not exceed 5,000 characters")
        String description
) {
    public AdminIngredientRequest {
        name = name == null ? null : name.strip();

        description = description == null || description.isBlank()
                ? null
                : description.strip();
    }
}