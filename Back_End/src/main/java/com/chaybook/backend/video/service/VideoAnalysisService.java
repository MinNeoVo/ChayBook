package com.chaybook.backend.video.service;
import com.chaybook.backend.video.dto.*;
import java.util.Optional;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface VideoAnalysisService {
    VideoSubmissionResponse submitUpload(Integer userId, MultipartFile file, boolean includeSummary);
    VideoSubmissionResponse submitUrl(Integer userId, SubmitVideoUrlRequest request);
    Optional<VideoSubmissionResponse> getActiveSubmission(Integer userId);
    VideoSubmissionResponse getSubmission(Integer userId, Integer submissionId);
    VideoAnalysisResponse getAnalysis(Integer userId, Integer analysisId);
    VideoAnalysisResponse updateDraft(Integer userId, Integer analysisId, UpdateVideoDraftRequest request);
    ConfirmVideoRecipeResponse confirm(Integer userId, Integer analysisId, ConfirmVideoRecipeRequest request);
    Resource getMedia(Integer userId, Integer submissionId);
}
