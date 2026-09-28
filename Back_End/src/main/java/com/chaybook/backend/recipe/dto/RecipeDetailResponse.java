package com.chaybook.backend.recipe.dto;

import java.util.List;

public record RecipeDetailResponse(
        Integer recipeId,
        Integer categoryId,
        String name,
        String description,
        String imageUrl,
        Integer prepTime,
        Integer cookTime,
        String instructions,
        List<RecipeIngredientResponse> ingredients
)  {
}
