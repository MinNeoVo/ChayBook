package com.chaybook.backend.video.dto;
public record VideoAnalysisResponse(
        Integer analysisId, Integer submissionId, String status,
        Long version, VideoExtractionResult extracted,
        VideoRecipeDraft draft, String errorCode, boolean canConfirm
) {}
