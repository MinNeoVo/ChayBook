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
        Integer servings,
        String difficulty,
        String instructions,
        Double calories,
        Double protein,
        Double carbs,
        Double fat,
        List<RecipeIngredientResponse> ingredients
) {
}