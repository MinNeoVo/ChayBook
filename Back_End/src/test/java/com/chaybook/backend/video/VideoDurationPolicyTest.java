package com.chaybook.backend.video;

import com.chaybook.backend.video.exception.VideoAnalysisException;
import com.chaybook.backend.video.policy.VideoDurationPolicy;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;

class VideoDurationPolicyTest {
    private final VideoDurationPolicy policy = new VideoDurationPolicy(VideoTestProperties.defaults("unused"));

    @ParameterizedTest @ValueSource(strings = {"301", "901", "7200"})
    void uploadsAreNotRestrictedByYoutubeDuration(String seconds) {
        assertEquals(0, new BigDecimal(seconds).compareTo(policy.upload(new BigDecimal(seconds))));
    }

    @Test void acceptsExactlyFifteenMinutesForYoutube() {
        assertEquals(new BigDecimal("900.000"), policy.youtube(new BigDecimal("900")));
    }

    @Test void rejectsYoutubeJustOverFifteenMinutes() {
        assertEquals("YOUTUBE_VIDEO_TOO_LONG", assertThrows(VideoAnalysisException.class,
                () -> policy.youtube(new BigDecimal("900.001"))).getCode());
    }

    @ParameterizedTest @ValueSource(strings = {"0", "-1"})
    void rejectsInvalidDurationsForBothSources(String seconds) {
        assertThrows(VideoAnalysisException.class, () -> policy.upload(new BigDecimal(seconds)));
        assertThrows(VideoAnalysisException.class, () -> policy.youtube(new BigDecimal(seconds)));
    }
}
