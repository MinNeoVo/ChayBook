package com.chaybook.backend.user.dto;

import com.chaybook.backend.community.dto.PostResponse;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO trả về cho trang Profile: thông tin user + danh sách bài viết của user.
 */
public record UserProfileResponse(
        Integer userId,
        String username,
        String email,
        String fullName,
        String avatarUrl,
        String role,
        String status,
        LocalDateTime createdAt,
        List<PostResponse> posts
) {
}
