package com.chaybook.backend.community.dto;

import java.time.LocalDateTime;

public record PostResponse(
        Integer postId,
        Integer userId,
        String username,
        String avatarUrl,
        Integer categoryId,
        String categoryName,
        String title,
        String content,
        String imageUrl,
        String status,
        LocalDateTime createdAt,
        long likeCount,
        long bookmarkCount,
        long commentCount,
        boolean likedByCurrentUser,
        boolean bookmarkedByCurrentUser
) {
}
