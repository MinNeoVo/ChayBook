package com.chaybook.backend.admin.article.dto;

import java.time.LocalDateTime;

public record AdminArticleResponse(
        Integer articleId,
        Integer categoryId,
        Integer createdBy,
        String title,
        String content,
        String coverImage,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public record Summary(
            Integer articleId,
            Integer categoryId,
            String title,
            String coverImage,
            String status,
            LocalDateTime updatedAt
    ) {
    }
}