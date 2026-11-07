package com.chaybook.backend.video.dto;

import com.chaybook.backend.video.enums.VideoSubmissionStatus;

public record VideoReviewDecision(
        VideoSubmissionStatus status,
        String code
) {
}