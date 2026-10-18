package com.chaybook.backend.moderation.dto;

public record ModerationAssessment(
        String result,
        String reason,
        Double confidence
) {
}