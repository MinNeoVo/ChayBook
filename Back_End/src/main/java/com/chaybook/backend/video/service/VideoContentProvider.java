package com.chaybook.backend.video.service;
import com.chaybook.backend.video.dto.*;

public interface VideoContentProvider {
    PreparedVideo prepare(VideoSourceInfo source);
    VideoReviewAssessment review(PreparedVideo video, VideoWork work);
    VideoExtractionResult extract(PreparedVideo video, VideoWork work);
    void release(PreparedVideo video);
}
