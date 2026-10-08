package com.chaybook.backend.admin.recipe.dto;

import com.chaybook.backend.recipe.dto.RecipeIngredientResponse;

import java.time.LocalDateTime;
import java.util.List;

public record AdminRecipeResponse(
        Integer recipeId,
        Integer categoryId,
        String categoryName,
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
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<RecipeIngredientResponse> ingredients
) {
    public record Summary(
            Integer recipeId,
            Integer categoryId,
            String categoryName,
            String name,
            String imageUrl,
            String status
    ) {
    }
}

