package com.chaybook.backend.auth.dto;

import java.time.LocalDateTime;

public record LoginResponse(
        String message,
        UserData user
) {

    public record UserData(
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
}
