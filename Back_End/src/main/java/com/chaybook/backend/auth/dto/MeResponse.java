package com.chaybook.backend.auth.dto;

import java.time.LocalDateTime;

public record MeResponse(
        Integer userId,
        String username,
        String email,
        String fullName,
        String avatarUrl,
        String role,
        boolean isPro,
        LocalDateTime proExpiresAt
) {
}
