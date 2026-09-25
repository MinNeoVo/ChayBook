package com.chaybook.backend.community.entity;

import com.chaybook.backend.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "POST_INTERACTION",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "UQ_POST_INTERACTION",
                        columnNames = {
                                "post_id",
                                "user_id",
                                "type"
                        }
                )
        }
)
public class PostInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "interaction_id")
    private Integer interactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public PostInteraction() {
    }

    public PostInteraction(Integer interactionId, Post post, User user, String type, LocalDateTime createdAt) {
        this.interactionId = interactionId;
        this.post = post;
        this.user = user;
        this.type = type;
        this.createdAt = createdAt;
    }

    public Integer getInteractionId() {
        return interactionId;
    }

    public void setInteractionId(Integer interactionId) {
        this.interactionId = interactionId;
    }

    public Post getPost() {
        return post;
    }

    public void setPost(Post post) {
        this.post = post;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
