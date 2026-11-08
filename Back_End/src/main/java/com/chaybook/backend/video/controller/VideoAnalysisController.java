package com.chaybook.backend.video.controller;
import com.chaybook.backend.video.dto.*;
import com.chaybook.backend.video.service.VideoAnalysisService;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/user/video-analyses")
public class VideoAnalysisController {
    private final VideoAnalysisService service;
    public VideoAnalysisController(VideoAnalysisService service) { this.service = service; }

    @GetMapping("/active")
    public ResponseEntity<VideoSubmissionResponse> active(@AuthenticationPrincipal Jwt jwt) {
        return service.getActiveSubmission(VideoAuthentication.requireUserId(jwt))
                .map(response -> ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(response))
                .orElseGet(() -> ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build());
    }

    @PostMapping(value = "/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VideoSubmissionResponse> upload(@AuthenticationPrincipal Jwt jwt,
            @RequestPart("file") MultipartFile file,
            @RequestParam(name = "includeSummary", defaultValue = "true") boolean includeSummary) {
        return accepted(service.submitUpload(VideoAuthentication.requireUserId(jwt), file, includeSummary));
    }

    @PostMapping(value = "/urls", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<VideoSubmissionResponse> url(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody SubmitVideoUrlRequest request) {
        return accepted(service.submitUrl(VideoAuthentication.requireUserId(jwt), request));
    }

    @GetMapping("/submissions/{submissionId}")
    public VideoSubmissionResponse submission(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("submissionId") Integer submissionId) {
        return service.getSubmission(VideoAuthentication.requireUserId(jwt), submissionId);
    }

    @GetMapping("/{analysisId}")
    public VideoAnalysisResponse analysis(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("analysisId") Integer analysisId) {
        return service.getAnalysis(VideoAuthentication.requireUserId(jwt), analysisId);
    }

    @PutMapping("/{analysisId}/draft")
    public VideoAnalysisResponse draft(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("analysisId") Integer analysisId,
            @Valid @RequestBody UpdateVideoDraftRequest request) {
        return service.updateDraft(VideoAuthentication.requireUserId(jwt), analysisId, request);
    }

    @PostMapping("/{analysisId}/confirm")
    public ConfirmVideoRecipeResponse confirm(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("analysisId") Integer analysisId,
            @Valid @RequestBody ConfirmVideoRecipeRequest request) {
        return service.confirm(VideoAuthentication.requireUserId(jwt), analysisId, request);
    }

    @GetMapping("/submissions/{submissionId}/media")
    public ResponseEntity<Resource> media(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("submissionId") Integer submissionId) {
        Resource resource = service.getMedia(VideoAuthentication.requireUserId(jwt), submissionId);
        return ResponseEntity.ok().contentType(MediaType.valueOf("video/mp4"))
                .cacheControl(CacheControl.noStore())
                .header("X-Content-Type-Options", "nosniff").body(resource);
    }

    private ResponseEntity<VideoSubmissionResponse> accepted(VideoSubmissionResponse response) {
        return ResponseEntity.accepted().location(URI.create(
                "/api/user/video-analyses/submissions/" + response.submissionId())).body(response);
    }
}
