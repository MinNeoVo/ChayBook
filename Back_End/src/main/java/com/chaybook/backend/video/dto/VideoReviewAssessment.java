package com.chaybook.backend.video.dto;

import com.chaybook.backend.video.enums.AssessmentAnswer;
import com.chaybook.backend.video.enums.RecipePresence;

import java.util.List;

public record VideoReviewAssessment(
        Check foodTopic,
        Check vegetarianFood,
        RecipePresence recipePresence,
        List<VideoEvidence> recipeEvidence
) {
    public record Check(
            AssessmentAnswer answer,
            String reason,
            List<VideoEvidence> evidence
    ) {
    }
}