package com.chaybook.backend.video.config;
import com.chaybook.backend.video.enums.DietaryRule;
import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "chaybook.video")
public record VideoAnalysisProperties(
        @Min(1) long maxBytes,
        @Min(1) int youtubeMaxDurationSeconds,
        @NotBlank String storageDirectory,
        @NotBlank String ffprobePath,
        @Min(1) int probeTimeoutSeconds,
        @Min(1) int connectTimeoutSeconds,
        @Min(1) int readTimeoutSeconds,
        @Min(1) int fileReadyTimeoutSeconds,
        @Min(60) int jobTimeoutSeconds,
        @Min(1) int retentionHours,
        @NotNull DietaryRule dietaryRule,
        @NotBlank String policyVersion,
        @NotBlank String model,
        String apiKey,
        String youtubeApiKey
) {
    @AssertTrue(message = "retention must exceed job timeout and job timeout must cover provider operations")
    public boolean isTimingValid() {
        return retentionHours * 3600L > jobTimeoutSeconds
                && jobTimeoutSeconds >= fileReadyTimeoutSeconds + 5L * readTimeoutSeconds;
    }
}
