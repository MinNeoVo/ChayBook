package com.chaybook.backend.recognition.dto;

public record RecipeSuggestionResponse(
        Integer recipeId,
        String name,
        String description,
        String imageUrl,
        Integer prepTime,
        Integer cookTime,
        Long matchedIngredientCount
) {
}