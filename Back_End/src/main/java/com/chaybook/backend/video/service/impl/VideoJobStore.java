package com.chaybook.backend.video.service.impl;
import com.chaybook.backend.video.config.VideoAnalysisProperties;
import com.chaybook.backend.video.dto.*;
import com.chaybook.backend.video.entity.*;
import com.chaybook.backend.video.enums.*;
import com.chaybook.backend.video.repository.*;
import java.time.*;
import java.util.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VideoJobStore {
    private final VideoSubmissionRepository submissions;
    private final VideoAnalysisRepository analyses;
    private final VideoUserGuard users;
    private final VideoAnalysisProperties p;
    private final VideoJson json;
    private final VideoDraftRules drafts;
    public VideoJobStore(VideoSubmissionRepository submissions, VideoAnalysisRepository analyses,
            VideoUserGuard users, VideoAnalysisProperties p, VideoJson json, VideoDraftRules drafts) {
        this.submissions = submissions; this.analyses = analyses; this.users = users;
        this.p = p; this.json = json; this.drafts = drafts;
    }

    @Transactional
    public VideoIntakeResult createSubmission(Integer userId, VideoSourceInfo source, boolean includeSummary) {
        // Serialize intake for this account across tabs and backend instances.
        // The lock is released when this short transaction commits; no AI/network work here.
        var user = users.requireActiveForSubmission(userId);
        var active = submissions.findActiveByUserId(userId, PageRequest.of(0, 1));
        if (!active.isEmpty())
            return new VideoIntakeResult(active.get(0).getSubmissionId(), false);
        var submission = new VideoSubmission(user, source.sourceType(), source.sourceUrl(),
                source.storageKey(), source.durationSeconds(), includeSummary,
                p.dietaryRule(), p.policyVersion());
        return new VideoIntakeResult(submissions.saveAndFlush(submission).getSubmissionId(), true);
    }

    @Transactional
    public Optional<VideoWork> claimReview() {
        var candidates = submissions.findByStatusOrderByCreatedAtAscSubmissionIdAsc(
                "QUEUED", PageRequest.of(0, 1));
        if (candidates.isEmpty()) return Optional.empty();
        var s = submissions.findByIdForUpdate(candidates.get(0).getSubmissionId()).orElseThrow();
        if (!"QUEUED".equals(s.getStatus())) return Optional.empty();
        if (!"ACTIVE".equals(s.getUser().getStatus())) {
            s.setStatus("FAILED"); s.setErrorCode("USER_INACTIVE");
            return Optional.empty();
        }
        UUID token = UUID.randomUUID();
        s.setStatus("CHECKING"); s.setAttemptToken(token);
        s.setLeaseUntil(now().plusSeconds(p.jobTimeoutSeconds()));
        return Optional.of(work(s.getSubmissionId(), token, s, null));
    }

    @Transactional
    public void completeReview(VideoWork work, VideoReviewAssessment review, VideoReviewDecision decision) {
        var s = submissions.findByIdForUpdate(work.id()).orElseThrow();
        if (!current(s.getStatus(), "CHECKING", s.getAttemptToken(), s.getLeaseUntil(), work.token())) return;
        s.setReviewJson(json.write(review));
        s.setStatus(decision.status().name()); s.setDecisionCode(decision.code());
        s.setAttemptToken(null); s.setLeaseUntil(null); s.setErrorCode(null);
        if (decision.status() == VideoSubmissionStatus.ACCEPTED)
            analyses.save(new VideoAnalysis(s));
    }

    @Transactional
    public Optional<VideoWork> claimAnalysis() {
        var candidates = analyses.findByStatusOrderByCreatedAtAscAnalysisIdAsc(
                "QUEUED", PageRequest.of(0, 1));
        if (candidates.isEmpty()) return Optional.empty();
        var a = analyses.findByIdForUpdate(candidates.get(0).getAnalysisId()).orElseThrow();
        if (!"QUEUED".equals(a.getStatus())) return Optional.empty();
        var s = a.getSubmission();
        if (!"ACCEPTED".equals(s.getStatus()) || !"ACTIVE".equals(s.getUser().getStatus())) {
            a.setStatus("FAILED"); a.setErrorCode("SUBMISSION_UNAVAILABLE");
            return Optional.empty();
        }
        UUID token = UUID.randomUUID();
        a.setStatus("PROCESSING"); a.setAttemptToken(token);
        a.setLeaseUntil(now().plusSeconds(p.jobTimeoutSeconds()));
        return Optional.of(work(a.getAnalysisId(), token, s,
                json.readStored(s.getReviewJson(), VideoReviewAssessment.class)));
    }

    @Transactional
    public void completeAnalysis(VideoWork work, VideoExtractionResult result,
            VideoRecipeDraft draft, VideoReviewDecision vegetarianDecision) {
        var a = analyses.findByIdForUpdate(work.id()).orElseThrow();
        if (!current(a.getStatus(), "PROCESSING", a.getAttemptToken(), a.getLeaseUntil(), work.token())) return;
        a.setExtractedJson(json.write(result));
        a.setAttemptToken(null); a.setLeaseUntil(null);
        if (vegetarianDecision.status() != VideoSubmissionStatus.ACCEPTED) {
            var s = submissions.findByIdForUpdate(a.getSubmission().getSubmissionId()).orElseThrow();
            s.setStatus(vegetarianDecision.status().name());
            s.setDecisionCode(vegetarianDecision.code());
            // Keep admission evidence consistent with the second assessment.
            var previous = json.readStored(s.getReviewJson(), VideoReviewAssessment.class);
            s.setReviewJson(json.write(new VideoReviewAssessment(previous.foodTopic(),
                    result.vegetarianFood(), result.recipePresence(), result.recipeHighlights())));
            a.setStatus("FAILED"); a.setErrorCode(vegetarianDecision.code()); a.setDraftJson(null);
            return;
        }
        a.setDraftJson(draft == null ? null : json.write(draft));
        a.setErrorCode(null);
        if (result.recipePresence() == RecipePresence.NONE
                || result.recipePresence() == RecipePresence.MENTION_ONLY) {
            a.setStatus("NO_RECIPE");
        } else {
            boolean complete = drafts.canConfirm(draft)
                    && result.missingFields().isEmpty() && result.warnings().isEmpty()
                    && draft.ingredients().stream().allMatch(i -> i.ingredientId() != null && i.amountText() != null);
            a.setStatus(complete ? "READY" : "PARTIAL");
        }
    }

    @Transactional
    public void failReview(VideoWork work, String code) {
        var s = submissions.findByIdForUpdate(work.id()).orElseThrow();
        if (!sameAttempt(s.getStatus(), "CHECKING", s.getAttemptToken(), work.token())) return;
        s.setStatus("FAILED"); s.setErrorCode(code);
        s.setAttemptToken(null); s.setLeaseUntil(null);
    }

    @Transactional
    public void failAnalysis(VideoWork work, String code) {
        var a = analyses.findByIdForUpdate(work.id()).orElseThrow();
        if (!sameAttempt(a.getStatus(), "PROCESSING", a.getAttemptToken(), work.token())) return;
        a.setStatus("FAILED"); a.setErrorCode(code);
        a.setAttemptToken(null); a.setLeaseUntil(null);
    }

    @Transactional
    public void recoverExpired() {
        LocalDateTime time = now();
        for (var candidate : submissions.findByStatusAndLeaseUntilBefore("CHECKING", time)) {
            var s = submissions.findByIdForUpdate(candidate.getSubmissionId()).orElseThrow();
            if ("CHECKING".equals(s.getStatus()) && s.getLeaseUntil() != null
                    && s.getLeaseUntil().isBefore(time)) {
                s.setStatus("FAILED"); s.setErrorCode("PROCESSING_TIMEOUT");
                s.setAttemptToken(null); s.setLeaseUntil(null);
            }
        }
        for (var candidate : analyses.findByStatusAndLeaseUntilBefore("PROCESSING", time)) {
            var a = analyses.findByIdForUpdate(candidate.getAnalysisId()).orElseThrow();
            if ("PROCESSING".equals(a.getStatus()) && a.getLeaseUntil() != null
                    && a.getLeaseUntil().isBefore(time)) {
                a.setStatus("FAILED"); a.setErrorCode("PROCESSING_TIMEOUT");
                a.setAttemptToken(null); a.setLeaseUntil(null);
            }
        }
    }

    private VideoWork work(Integer id, UUID token, VideoSubmission s, VideoReviewAssessment assessment) {
        return new VideoWork(id, token, new VideoSourceInfo(s.getSourceType(), s.getSourceUrl(),
                s.getStorageKey(), s.getDurationSeconds()), s.isIncludeSummary(),
                DietaryRule.valueOf(s.getDietaryRule()), s.getPolicyVersion(), assessment);
    }
    private boolean current(String actual, String expected, UUID token, LocalDateTime lease, UUID wanted) {
        return sameAttempt(actual, expected, token, wanted) && lease != null && lease.isAfter(now());
    }
    private boolean sameAttempt(String actual, String expected, UUID token, UUID wanted) {
        return expected.equals(actual) && wanted.equals(token);
    }
    private LocalDateTime now() { return LocalDateTime.now(ZoneOffset.UTC); }
}
