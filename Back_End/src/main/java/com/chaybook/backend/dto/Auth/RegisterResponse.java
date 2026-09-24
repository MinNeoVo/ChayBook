package com.chaybook.backend.dto.Auth;

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
