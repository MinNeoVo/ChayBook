package com.chaybook.backend.assistant.dto;

import java.time.LocalDateTime;

public record ChatConversationResponse(
        Integer conversationId,
        String title,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}