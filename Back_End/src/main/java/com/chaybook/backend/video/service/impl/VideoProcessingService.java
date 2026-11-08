package com.chaybook.backend.video.service.impl;
import com.chaybook.backend.video.dto.*;
import com.chaybook.backend.video.exception.VideoAnalysisException;
import com.chaybook.backend.video.policy.VideoReviewPolicy;
import com.chaybook.backend.video.service.VideoContentProvider;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class VideoProcessingService {
    private static final Logger log = LoggerFactory.getLogger(VideoProcessingService.class);
    private final VideoJobStore jobs;
    private final VideoSourceService sources;
    private final VideoContentProvider provider;
    private final VideoResultValidator validator;
    private final VideoReviewPolicy policy;
    private final VideoIngredientMatcher matcher;
    public VideoProcessingService(VideoJobStore jobs, VideoSourceService sources,
            VideoContentProvider provider, VideoResultValidator validator,
            VideoReviewPolicy policy, VideoIngredientMatcher matcher) {
        this.jobs = jobs; this.sources = sources; this.provider = provider;
        this.validator = validator; this.policy = policy; this.matcher = matcher;
    }

    public void processReview() { jobs.claimReview().ifPresent(this::review); }
    public void processAnalysis() { jobs.claimAnalysis().ifPresent(this::extract); }

    private void review(VideoWork work) {
        PreparedVideo prepared = null;
        try {
            sources.verifyAvailable(work.source());
            prepared = provider.prepare(work.source());
            var assessment = provider.review(prepared, work);
            validator.review(assessment, work.source().durationSeconds());
            jobs.completeReview(work, assessment, policy.evaluate(assessment));
        } catch (RuntimeException e) {
            log.warn("Video submission={} review failed code={}", work.id(), errorCode(e));
            jobs.failReview(work, errorCode(e));
        } finally {
            provider.release(prepared);
        }
    }

    private void extract(VideoWork work) {
        PreparedVideo prepared = null;
        try {
            sources.verifyAvailable(work.source());
            prepared = provider.prepare(work.source());
            var result = provider.extract(prepared, work);
            validator.extraction(result, work.source().durationSeconds(), work.includeSummary());
            // Reuse the same policy for the vegetarian recheck.
            var decision = policy.evaluate(new VideoReviewAssessment(work.assessment().foodTopic(),
                    result.vegetarianFood(), result.recipePresence(), result.recipeHighlights()));
            var draft = decision.status().name().equals("ACCEPTED") ? matcher.createDraft(result) : null;
            jobs.completeAnalysis(work, result, draft, decision);
        } catch (RuntimeException e) {
            log.warn("Video analysis={} extraction failed code={}", work.id(), errorCode(e));
            jobs.failAnalysis(work, errorCode(e));
        } finally {
            provider.release(prepared);
        }
    }

    private String errorCode(RuntimeException e) {
        return e instanceof VideoAnalysisException known ? known.getCode() : "PROCESSING_FAILED";
    }
}
