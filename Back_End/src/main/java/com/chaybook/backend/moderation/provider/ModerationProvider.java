package com.chaybook.backend.moderation.provider;

import com.chaybook.backend.moderation.dto.ModerationAssessment;

public interface ModerationProvider {

    ModerationAssessment evaluate(String title, String content, String imageUrl);
}