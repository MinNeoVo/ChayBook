package com.chaybook.backend.user.dto;

public record UpdateProfileResponse(
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
            String status
    ) {
    }
}