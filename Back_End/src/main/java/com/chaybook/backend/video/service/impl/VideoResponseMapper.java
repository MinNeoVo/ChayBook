package com.chaybook.backend.video.service.impl;
import com.chaybook.backend.video.dto.*;
import com.chaybook.backend.video.entity.*;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class VideoResponseMapper {
    private final VideoJson json;
    private final VideoDraftRules drafts;
    public VideoResponseMapper(VideoJson json, VideoDraftRules drafts) {
        this.json = json; this.drafts = drafts;
    }

    public VideoSubmissionResponse submission(VideoSubmission s, Integer analysisId) {
        return new VideoSubmissionResponse(s.getSubmissionId(), s.getStatus(), s.getDecisionCode(),
                s.getErrorCode(), analysisId, json.readStored(s.getReviewJson(), VideoReviewAssessment.class),
                s.getSourceType(), s.getSourceUrl(), s.getDurationSeconds());
    }

    public VideoAnalysisResponse analysis(VideoAnalysis a) {
        var draft = json.readStored(a.getDraftJson(), VideoRecipeDraft.class);
        boolean editable = Set.of("READY", "PARTIAL").contains(a.getStatus());
        return new VideoAnalysisResponse(a.getAnalysisId(), a.getSubmission().getSubmissionId(),
                a.getStatus(), a.getVersion(),
                json.readStored(a.getExtractedJson(), VideoExtractionResult.class),
                draft, a.getErrorCode(), editable && drafts.canConfirm(draft));
    }

    public UserRecipeResponse recipe(UserRecipe recipe) {
        var analysis = recipe.getAnalysis();
        return new UserRecipeResponse(recipe.getUserRecipeId(), recipe.getName(),
                json.readStored(recipe.getRecipeJson(), VideoRecipeDraft.class),
                json.readStored(analysis.getExtractedJson(), VideoExtractionResult.class),
                analysis.getSubmission().getSubmissionId(), recipe.getCreatedAt());
    }
}
