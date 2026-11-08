package com.chaybook.backend.video;

import com.chaybook.backend.video.config.VideoAnalysisProperties;
import com.chaybook.backend.video.enums.DietaryRule;

public final class VideoTestProperties {
    private VideoTestProperties() {}

    public static VideoAnalysisProperties defaults(String directory) {
        return new VideoAnalysisProperties(50_000_000L, 900, directory, "ffprobe", 15,
                10, 120, 180, 900, 72, DietaryRule.LACTO_OVO, "v1",
                "test-model", "test-key", "test-youtube-key");
    }
}
