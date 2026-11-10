package com.chaybook.backend.video.dto;
import com.chaybook.backend.video.enums.DietaryRule;
import java.util.UUID;
public record VideoWork(
        Integer id, UUID token, VideoSourceInfo source,
        boolean includeSummary, DietaryRule dietaryRule,
        String policyVersion, VideoReviewAssessment assessment
) {}
