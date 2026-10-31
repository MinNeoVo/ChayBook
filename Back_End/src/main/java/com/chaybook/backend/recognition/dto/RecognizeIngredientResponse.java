package com.chaybook.backend.recognition.dto;

import com.chaybook.backend.recognition.enums.RecognitionStatus;

import java.util.List;

public record RecognizeIngredientResponse(
        Integer recognitionId,
        String imageUrl,
        RecognitionStatus status,
        String message,
        List<RecognizedIngredientResponse> items,
        List<RecipeSuggestionResponse> suggestedRecipes
) {
}