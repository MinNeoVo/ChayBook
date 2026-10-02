package com.chaybook.backend.article.service;

import java.time.LocalDateTime;

public record ArticleResponse(
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
}