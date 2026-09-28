package com.chaybook.backend.recipe.dto;

import java.util.List;

public record RecipeCreateResponse(
        Integer recipeId,
        Integer categoryId,
        Integer createdBy,
        String name,
        String description,
        String imageUrl,
        Integer prepTime,
        Integer cookTime,
        String instructions,
        List<RecipeIngredientResponse> ingredients
) {
}
