package com.chaybook.backend.community.dto;

import java.util.List;

public record CommentPageResponse(
        List<CommentResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext,
        long totalCommentCount
) {
}