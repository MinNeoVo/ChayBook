package com.chaybook.backend.video.dto;

import java.util.List;

public record VideoRecipeDraft(
        String name,
        List<IngredientDraft> ingredients,
        List<String> steps
) {
    public record IngredientDraft(
            Integer ingredientId,
            String name,
            String amountText
    ) {
    }
}