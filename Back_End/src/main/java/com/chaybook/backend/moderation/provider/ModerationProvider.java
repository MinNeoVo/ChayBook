package com.chaybook.backend.moderation.provider;

import com.chaybook.backend.moderation.dto.ModerationAssessment;

import java.util.List;

public interface ModerationProvider {

    ModerationAssessment evaluate(String title, String content, String transcript, List<String> imageUrlsOrFrameDataUrls, boolean videoFrames);
}