package com.chaybook.backend.video.policy;

import com.chaybook.backend.video.config.VideoAnalysisProperties;
import com.chaybook.backend.video.exception.VideoAnalysisException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class VideoDurationPolicy {
    private final VideoAnalysisProperties properties;

    public VideoDurationPolicy(VideoAnalysisProperties properties) {
        this.properties = properties;
    }

    public BigDecimal upload(BigDecimal seconds) {
        requirePositive(seconds);
        return seconds.setScale(3, RoundingMode.HALF_UP);
    }

    public BigDecimal youtube(BigDecimal seconds) {
        requirePositive(seconds);
        if (seconds.compareTo(BigDecimal.valueOf(properties.youtubeMaxDurationSeconds())) > 0) {
            throw new VideoAnalysisException(HttpStatus.BAD_REQUEST, "YOUTUBE_VIDEO_TOO_LONG",
                    "Video YouTube tối đa " + properties.youtubeMaxDurationSeconds() / 60 + " phút.");
        }
        return seconds.setScale(3, RoundingMode.HALF_UP);
    }

    private void requirePositive(BigDecimal seconds) {
        if (seconds == null || seconds.signum() <= 0) {
            throw new VideoAnalysisException(HttpStatus.BAD_REQUEST, "INVALID_VIDEO_DURATION",
                    "Không đọc được thời lượng video hợp lệ.");
        }
    }
}
