package com.chaybook.backend.video.dto;
import java.time.LocalDateTime;
public record UserRecipeResponse(
        Integer userRecipeId, String name, VideoRecipeDraft recipe,
        VideoExtractionResult originalExtraction, Integer submissionId,
        LocalDateTime createdAt
) {}
