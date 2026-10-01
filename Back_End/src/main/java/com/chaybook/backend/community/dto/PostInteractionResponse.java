package com.chaybook.backend.community.dto;

public record PostInteractionResponse(
        String message,
        String type,
        boolean active
) {
}
