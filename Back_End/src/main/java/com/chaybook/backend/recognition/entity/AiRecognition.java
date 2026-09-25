package com.chaybook.backend.recognition.entity;

import com.chaybook.backend.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "AI_RECOGNITION")
public class AiRecognition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recognition_id")
    private Integer recognitionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(name = "status", length = 50)
    private String status;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public AiRecognition() {
    }

    public AiRecognition(Integer recognitionId, User user, String imageUrl,
                         String status, LocalDateTime createdAt) {
        this.recognitionId = recognitionId;
        this.user = user;
        this.imageUrl = imageUrl;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Integer getRecognitionId() {
        return recognitionId;
    }

    public void setRecognitionId(Integer recognitionId) {
        this.recognitionId = recognitionId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
