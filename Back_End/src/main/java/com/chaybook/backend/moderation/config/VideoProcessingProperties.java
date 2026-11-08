package com.chaybook.backend.moderation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "moderation.video")
public record VideoProcessingProperties(
        String ffmpegPath,
        String ffprobePath,
        int maxDurationSeconds,
        int maxFileSizeBytes
) {
}