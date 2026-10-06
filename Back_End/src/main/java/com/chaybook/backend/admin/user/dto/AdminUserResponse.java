package com.chaybook.backend.admin.user.dto;

import java.time.LocalDateTime;

public record AdminUserResponse(
        Integer userId,
        String username,
        String email,
        String fullName,
        String status,
        LocalDateTime createdAt
) {
}
