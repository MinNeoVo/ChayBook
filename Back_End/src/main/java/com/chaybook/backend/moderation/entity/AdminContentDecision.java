package com.chaybook.backend.moderation.entity;

import com.chaybook.backend.community.entity.Post;
import com.chaybook.backend.user.entity.User;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Nationalized;

import java.time.LocalDateTime;

@Entity
@Table(name = "ADMIN_CONTENT_DECISION")
public class AdminContentDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "decision_id")
    private Integer decisionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    @Nationalized
    @Column(name = "previous_status", nullable = false, length = 50)
    private String previousStatus;

    @Nationalized
    @Column(name = "decision", nullable = false, length = 20)
    private String decision;

    @Nationalized
    @Column(name = "reason", columnDefinition = "NVARCHAR(MAX)")
    private String reason;

    @CreationTimestamp
    @Column(name = "decided_at", nullable = false)
    private LocalDateTime decidedAt;

    public AdminContentDecision() {
    }

    public AdminContentDecision(
            Post post,
            User admin,
            String previousStatus,
            String decision,
            String reason
    ) {
        this.post = post;
        this.admin = admin;
        this.previousStatus = previousStatus;
        this.decision = decision;
        this.reason = reason;
    }

    public Integer getDecisionId() {
        return decisionId;
    }

    public Post getPost() {
        return post;
    }

    public void setPost(Post post) {
        this.post = post;
    }

    public User getAdmin() {
        return admin;
    }

    public void setAdmin(User admin) {
        this.admin = admin;
    }

    public String getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(String previousStatus) {
        this.previousStatus = previousStatus;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getDecidedAt() {
        return decidedAt;
    }
}