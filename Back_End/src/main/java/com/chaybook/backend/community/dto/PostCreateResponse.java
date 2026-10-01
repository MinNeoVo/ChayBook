package com.chaybook.backend.community.dto;

import java.time.LocalDateTime;

public record PostCreateResponse(
        String message,
        PostData post
) {
    public record PostData(
            Integer postId,
            Integer userId,
            Integer categoryId,
            String title,
            String content,
            String imageUrl,
            String status,
            LocalDateTime createdAt
    ){

    }
}
