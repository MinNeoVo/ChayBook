package com.chaybook.backend.recognition.dto;

public record RecognizedIngredientResponse(
        Integer recognitionItemId,
        Integer ingredientId,
        String detectedName,
        Double confidence
) {
}