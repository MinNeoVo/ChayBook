package com.chaybook.backend.recognition.dto;

import java.util.List;

public record RecognitionModelResponse(
        List<DetectedIngredient> items
) {
    public record DetectedIngredient(
            String detectedName,
            Double confidence
    ) {
    }
}