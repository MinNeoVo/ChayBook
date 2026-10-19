package com.chaybook.backend.admin.post.dto;

import java.time.LocalDateTime;
import java.util.List;

public record AdminPostVideoResponse(
        Integer id,
        String type,
        String title,
        String description,
        String creator,
        LocalDateTime submittedAt,
        String status,
        String thumbnailUrl,
        String mediaUrl,
        String aiResult,
        String aiReason,
        Double aiConfidence,
        String moderationStatus,
        String adminReason
) {
    public record Statistics(
            long totalSubmission,
            long pendingModeration,
            long approvedLive,
            long rejectedEntries
    ) {}

    public record Page(
            List<AdminPostVideoResponse> items,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {}

    public record StatusRequest(
            @jakarta.validation.constraints.NotBlank
            @jakarta.validation.constraints.Pattern(regexp = "APPROVED|REJECTED|REMOVED")
            String status,
            String reason
    ) {}
}
