package com.chaybook.backend.video.entity;

import com.chaybook.backend.video.enums.VideoAnalysisStatus;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "VIDEO_RECIPE_ANALYSIS")
public class VideoAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "analysis_id")
    private Integer analysisId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "submission_id",
            nullable = false,
            unique = true,
            updatable = false
    )
    private VideoSubmission submission;

    @Column(name = "status", nullable = false, length = 30)
    private String status = VideoAnalysisStatus.QUEUED.name();

    @Column(name = "extracted_json", columnDefinition = "NVARCHAR(MAX)")
    private String extractedJson;

    @Column(name = "draft_json", columnDefinition = "NVARCHAR(MAX)")
    private String draftJson;

    @Column(name = "error_code", length = 80)
    private String errorCode;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "attempt_token", columnDefinition = "uniqueidentifier")
    private UUID attemptToken;

    @Column(name = "lease_until")
    private LocalDateTime leaseUntil;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public VideoAnalysis() {
    }

    public VideoAnalysis(VideoSubmission submission) {
        this.submission = submission;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public Integer getAnalysisId() {
        return analysisId;
    }

    public VideoSubmission getSubmission() {
        return submission;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getExtractedJson() {
        return extractedJson;
    }

    public void setExtractedJson(String extractedJson) {
        this.extractedJson = extractedJson;
    }

    public String getDraftJson() {
        return draftJson;
    }

    public void setDraftJson(String draftJson) {
        this.draftJson = draftJson;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public Long getVersion() {
        return version;
    }

    public UUID getAttemptToken() {
        return attemptToken;
    }

    public void setAttemptToken(UUID attemptToken) {
        this.attemptToken = attemptToken;
    }

    public LocalDateTime getLeaseUntil() {
        return leaseUntil;
    }

    public void setLeaseUntil(LocalDateTime leaseUntil) {
        this.leaseUntil = leaseUntil;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}