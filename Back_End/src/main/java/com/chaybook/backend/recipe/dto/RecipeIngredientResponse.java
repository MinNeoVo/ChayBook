package com.chaybook.backend.recipe.dto;

public record RecipeIngredientResponse(
        Integer ingredientId,
        String name,
        Double quantity,
        String unit
)  {
}
