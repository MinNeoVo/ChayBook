package com.chaybook.backend.video.entity;

import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.video.enums.DietaryRule;
import com.chaybook.backend.video.enums.VideoSubmissionStatus;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "VIDEO_SUBMISSION")
public class VideoSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submission_id")
    private Integer submissionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(name = "source_type", nullable = false, length = 20)
    private String sourceType;

    @Column(
            name = "source_url",
            length = 2048,
            columnDefinition = "NVARCHAR(2048)"
    )
    private String sourceUrl;

    @Column(
            name = "storage_key",
            length = 255,
            columnDefinition = "NVARCHAR(255)"
    )
    private String storageKey;

    @Column(
            name = "duration_seconds",
            nullable = false,
            precision = 10,
            scale = 3
    )
    private BigDecimal durationSeconds;

    @Column(name = "include_summary", nullable = false)
    private boolean includeSummary;

    @Column(name = "dietary_rule", nullable = false, length = 20)
    private String dietaryRule;

    @Column(name = "policy_version", nullable = false, length = 30)
    private String policyVersion;

    @Column(name = "status", nullable = false, length = 30)
    private String status = VideoSubmissionStatus.QUEUED.name();

    @Column(name = "decision_code", length = 80)
    private String decisionCode;

    @Column(name = "review_json", columnDefinition = "NVARCHAR(MAX)")
    private String reviewJson;

    @Column(name = "error_code", length = 80)
    private String errorCode;

    @Column(name = "attempt_token", columnDefinition = "uniqueidentifier")
    private UUID attemptToken;

    @Column(name = "lease_until")
    private LocalDateTime leaseUntil;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public VideoSubmission() {
    }

    public VideoSubmission(
            User user,
            String sourceType,
            String sourceUrl,
            String storageKey,
            BigDecimal durationSeconds,
            boolean includeSummary,
            DietaryRule dietaryRule,
            String policyVersion
    ) {
        this.user = user;
        this.sourceType = sourceType;
        this.sourceUrl = sourceUrl;
        this.storageKey = storageKey;
        this.durationSeconds = durationSeconds;
        this.includeSummary = includeSummary;
        this.dietaryRule = dietaryRule.name();
        this.policyVersion = policyVersion;
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

    public Integer getSubmissionId() {
        return submissionId;
    }

    public User getUser() {
        return user;
    }

    public String getSourceType() {
        return sourceType;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public BigDecimal getDurationSeconds() {
        return durationSeconds;
    }

    public boolean isIncludeSummary() {
        return includeSummary;
    }

    public String getDietaryRule() {
        return dietaryRule;
    }

    public String getPolicyVersion() {
        return policyVersion;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDecisionCode() {
        return decisionCode;
    }

    public void setDecisionCode(String decisionCode) {
        this.decisionCode = decisionCode;
    }

    public String getReviewJson() {
        return reviewJson;
    }

    public void setReviewJson(String reviewJson) {
        this.reviewJson = reviewJson;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
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