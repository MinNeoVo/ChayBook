package com.chaybook.backend.recognition.dto;

public record ConnectionCheckResponse(
        boolean connected,
        String model,
        String message,
        String providerResponse
) {
}