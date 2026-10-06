package com.chaybook.backend.admin.user.dto;

public record UpdateUserStatusResponse(
        String message,
        Integer userId,
        String status
) {
}
