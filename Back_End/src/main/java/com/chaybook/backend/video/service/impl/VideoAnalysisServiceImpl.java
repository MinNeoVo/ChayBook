package com.chaybook.backend.video.service.impl;
import com.chaybook.backend.video.dto.*;
import com.chaybook.backend.video.entity.*;
import com.chaybook.backend.video.exception.VideoAnalysisException;
import com.chaybook.backend.video.repository.*;
import com.chaybook.backend.video.service.VideoAnalysisService;
import java.util.*;
import org.springframework.core.io.*;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class VideoAnalysisServiceImpl implements VideoAnalysisService {
    private final VideoSubmissionRepository submissions;
    private final VideoAnalysisRepository analyses;
    private final UserRecipeRepository recipes;
    private final VideoUserGuard users;
    private final VideoSourceService sources;
    private final PrivateVideoStorage storage;
    private final VideoJobStore jobs;
    private final VideoJson json;
    private final VideoDraftRules drafts;
    private final VideoIngredientMatcher matcher;
    private final VideoResponseMapper responses;

    public VideoAnalysisServiceImpl(VideoSubmissionRepository submissions,
            VideoAnalysisRepository analyses, UserRecipeRepository recipes, VideoUserGuard users,
            VideoSourceService sources, PrivateVideoStorage storage, VideoJobStore jobs,
            VideoJson json, VideoDraftRules drafts, VideoIngredientMatcher matcher,
            VideoResponseMapper responses) {
        this.submissions = submissions; this.analyses = analyses; this.recipes = recipes;
        this.users = users; this.sources = sources; this.storage = storage; this.jobs = jobs;
        this.json = json; this.drafts = drafts; this.matcher = matcher; this.responses = responses;
    }

    @Override
    public VideoSubmissionResponse submitUpload(Integer userId, MultipartFile file, boolean includeSummary) {
        var active = getActiveSubmission(userId);
        if (active.isPresent()) return active.get();
        VideoSourceInfo source = sources.upload(file);
        VideoIntakeResult intake;
        try { intake = jobs.createSubmission(userId, source, includeSummary); }
        catch (RuntimeException e) { storage.deleteQuietly(source.storageKey()); throw e; }
        if (!intake.created()) storage.deleteQuietly(source.storageKey());
        return getSubmission(userId, intake.submissionId());
    }

    @Override
    public VideoSubmissionResponse submitUrl(Integer userId, SubmitVideoUrlRequest request) {
        var active = getActiveSubmission(userId);
        if (active.isPresent()) return active.get();
        VideoSourceInfo source = sources.youtube(request.url());
        var intake = jobs.createSubmission(userId, source, request.includeSummary());
        return getSubmission(userId, intake.submissionId());
    }

    @Override @Transactional(readOnly = true)
    public Optional<VideoSubmissionResponse> getActiveSubmission(Integer userId) {
        users.requireActive(userId);
        return submissions.findActiveByUserId(userId, PageRequest.of(0, 1)).stream()
                .findFirst().map(this::submissionResponse);
    }

    @Override @Transactional(readOnly = true)
    public VideoSubmissionResponse getSubmission(Integer userId, Integer submissionId) {
        users.requireActive(userId);
        var s = ownedSubmission(userId, submissionId);
        return submissionResponse(s);
    }

    @Override @Transactional(readOnly = true)
    public VideoAnalysisResponse getAnalysis(Integer userId, Integer analysisId) {
        users.requireActive(userId);
        var a = analyses.findOwned(analysisId, userId).orElseThrow(this::notFound);
        return responses.analysis(a);
    }

    @Override @Transactional
    public VideoAnalysisResponse updateDraft(Integer userId, Integer analysisId, UpdateVideoDraftRequest request) {
        users.requireActive(userId);
        var a = analyses.findOwnedForUpdate(analysisId, userId).orElseThrow(this::notFound);
        requireEditable(a);
        requireVersion(a, request.version());
        drafts.validateShape(request.draft());
        matcher.validateReferences(request.draft(), false);
        a.setDraftJson(json.write(request.draft()));
        // Preserve extractedJson and the original READY/PARTIAL classification.
        analyses.saveAndFlush(a);
        return responses.analysis(a);
    }

    @Override @Transactional
    public ConfirmVideoRecipeResponse confirm(Integer userId, Integer analysisId,
            ConfirmVideoRecipeRequest request) {
        users.requireActive(userId);
        var a = analyses.findOwnedForUpdate(analysisId, userId).orElseThrow(this::notFound);
        var existing = recipes.findByAnalysis_AnalysisId(analysisId);
        if (existing.isPresent()) return new ConfirmVideoRecipeResponse(existing.get().getUserRecipeId());
        requireEditable(a);
        requireVersion(a, request.version());
        var draft = json.readStored(a.getDraftJson(), VideoRecipeDraft.class);
        drafts.requireComplete(draft);
        matcher.validateReferences(draft, true);
        var recipe = recipes.saveAndFlush(new UserRecipe(a, draft.name().trim(), json.write(draft)));
        a.setStatus("CONFIRMED");
        analyses.saveAndFlush(a);
        return new ConfirmVideoRecipeResponse(recipe.getUserRecipeId());
    }

    @Override @Transactional(readOnly = true)
    public Resource getMedia(Integer userId, Integer submissionId) {
        users.requireActive(userId);
        var s = ownedSubmission(userId, submissionId);
        if (!"UPLOAD".equals(s.getSourceType()))
            throw new VideoAnalysisException(HttpStatus.BAD_REQUEST, "NOT_UPLOADED_VIDEO",
                    "Nguồn này là link YouTube.");
        return new FileSystemResource(storage.requireFile(s.getStorageKey()));
    }

    private VideoSubmission ownedSubmission(Integer userId, Integer submissionId) {
        return submissions.findBySubmissionIdAndUser_UserId(submissionId, userId).orElseThrow(this::notFound);
    }
    private VideoSubmissionResponse submissionResponse(VideoSubmission submission) {
        Integer analysisId = analyses.findBySubmission_SubmissionId(submission.getSubmissionId())
                .map(VideoAnalysis::getAnalysisId).orElse(null);
        return responses.submission(submission, analysisId);
    }
    private void requireEditable(VideoAnalysis a) {
        if (!Set.of("READY", "PARTIAL").contains(a.getStatus())
                || !"ACCEPTED".equals(a.getSubmission().getStatus()) || a.getDraftJson() == null)
            throw new VideoAnalysisException(HttpStatus.CONFLICT, "ANALYSIS_NOT_EDITABLE",
                    "Kết quả hiện tại chưa có bản nháp công thức để chỉnh sửa/xác nhận.");
    }
    private void requireVersion(VideoAnalysis a, Long version) {
        if (version == null || !Objects.equals(a.getVersion(), version))
            throw new VideoAnalysisException(HttpStatus.CONFLICT, "DRAFT_VERSION_CONFLICT",
                    "Bản nháp đã thay đổi. Hãy tải lại trước khi lưu.");
    }
    private VideoAnalysisException notFound() {
        return new VideoAnalysisException(HttpStatus.NOT_FOUND, "VIDEO_NOT_FOUND", "Không tìm thấy video của bạn.");
    }
}
