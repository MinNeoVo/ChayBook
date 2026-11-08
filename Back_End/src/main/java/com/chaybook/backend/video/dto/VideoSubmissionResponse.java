package com.chaybook.backend.video.dto;
import java.math.BigDecimal;

public record VideoSubmissionResponse(
        Integer submissionId, String status, String decisionCode, String errorCode,
        Integer analysisId, VideoReviewAssessment review,
        String sourceType, String sourceUrl, BigDecimal durationSeconds
) {}
