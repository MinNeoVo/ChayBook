package com.chaybook.backend.moderation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "groq")
public record GroqProperties(
        String baseUrl,
        String apiKey,
        String model
) {
}