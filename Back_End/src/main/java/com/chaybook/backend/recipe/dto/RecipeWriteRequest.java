package com.chaybook.backend.recipe.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public record RecipeWriteRequest(
        @NotNull
        @Positive
        Integer categoryId,

        @NotBlank
        @Size(max = 255)
        String name,

        String description,

        @Size(max = 255)
        String imageUrl,

        @NotNull
        @PositiveOrZero
        Integer prepTime,

        @NotNull
        @PositiveOrZero
        Integer cookTime,

        @NotBlank
        String instructions,

        @NotEmpty
        List<@NotNull @Valid RecipeIngredientRequest> ingredients
) {

}
