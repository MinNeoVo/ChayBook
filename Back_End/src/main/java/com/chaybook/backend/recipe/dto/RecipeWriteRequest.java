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
        @tools.jackson.databind.annotation.JsonDeserialize(using = WholeIntegerDeserializer.class)
        Integer prepTime,

        @NotNull
        @PositiveOrZero
        @tools.jackson.databind.annotation.JsonDeserialize(using = WholeIntegerDeserializer.class)
        Integer cookTime,

        @NotNull
        @Positive
        @tools.jackson.databind.annotation.JsonDeserialize(using = WholeIntegerDeserializer.class)
        Integer servings,

        @NotBlank
        @Size(max = 50)
        String difficulty,

        @NotBlank
        String instructions,

        @PositiveOrZero
        Double calories,

        @PositiveOrZero
        Double protein,

        @PositiveOrZero
        Double carbs,

        @PositiveOrZero
        Double fat,

        @NotEmpty
        List<@NotNull @Valid RecipeIngredientRequest> ingredients
) {
}
