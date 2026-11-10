package com.chaybook.backend.moderation.video;

import java.util.List;

public record VideoAnalysis(
        List<String> frameDataUrls,
        byte[] audioBytes,
        boolean hasAudio,
        String failureReason
) {
    public boolean hasFailure() {
        return failureReason != null && !failureReason.isBlank();
    }
}