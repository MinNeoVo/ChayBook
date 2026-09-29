package com.chaybook.backend.auth.dto;

public record MeResponse(
        Integer userId,
        String username,
        String email,
        String fullName,
        String avatarUrl,
        String role
) {
}