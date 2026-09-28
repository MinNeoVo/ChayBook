package com.chaybook.backend.auth.dto;

public record LoginResponse(
        String message,
        String token,
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