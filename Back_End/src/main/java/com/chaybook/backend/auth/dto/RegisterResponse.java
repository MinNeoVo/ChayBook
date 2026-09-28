package com.chaybook.backend.auth.dto;

public record RegisterResponse(
        String message,
        UserData user
) {
    public record UserData(
            Integer userId,
            String username,
            String email,
            String fullName,
            String role
    ) {
    }
}
