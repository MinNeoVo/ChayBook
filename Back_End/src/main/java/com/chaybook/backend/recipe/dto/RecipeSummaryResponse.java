package com.chaybook.backend.recipe.dto;

public record RecipeSummaryResponse(
        Integer recipeId,
        Integer categoryId,
        String name,
        String description,
        String imageUrl,
        Integer prepTime,
        Integer cookTime
) {
}
