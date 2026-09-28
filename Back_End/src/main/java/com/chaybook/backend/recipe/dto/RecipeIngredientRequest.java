package com.chaybook.backend.recipe.dto;

import jakarta.validation.constraints.*;

public record RecipeIngredientRequest(
        @NotNull
        @Positive
        Integer ingredientId,

        @NotNull
        @Positive
        Double quantity,

        @NotBlank
        @Size(max = 50)
        String unit
) {
}
