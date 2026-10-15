package com.chaybook.backend.assistant.dto;

import java.time.LocalDateTime;

public record ChatHistoryMessageResponse(
        Integer messageId,
        String sender,
        String message,
        LocalDateTime createdAt) {
}