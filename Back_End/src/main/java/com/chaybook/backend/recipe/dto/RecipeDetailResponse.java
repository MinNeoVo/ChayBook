package com.chaybook.backend.recipe.dto;

import java.util.List;

public record RecipeDetailResponse(
        Integer recipeId,
        Integer categoryId,
        String categoryName,
        String name,
        String description,
        String imageUrl,
        Integer prepTime,
        Integer cookTime,
        Integer servings,
        String difficulty,
        String instructions,
        Double calories,
        Double protein,
        Double carbs,
        Double fat,
        List<RecipeIngredientResponse> ingredients
)  {
}
