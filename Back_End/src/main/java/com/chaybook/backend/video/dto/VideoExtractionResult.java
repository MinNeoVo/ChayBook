package com.chaybook.backend.video.dto;
import com.chaybook.backend.video.enums.RecipePresence;
import java.util.List;

public record VideoExtractionResult(
        VideoReviewAssessment.Check vegetarianFood,
        RecipePresence recipePresence,
        String summary,
        List<VideoEvidence> recipeHighlights,
        Recipe recipe,
        List<String> missingFields,
        List<String> warnings
) {
    public record Recipe(String name, List<Ingredient> ingredients, List<String> steps) {}
    public record Ingredient(String detectedName, String amountText) {}
}
