package com.chaybook.backend.community.entity;

import com.chaybook.backend.community.enums.CommentStatus;
import com.chaybook.backend.user.entity.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Entity
@Table(name = "[COMMENT]")
public class Comment {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private Comment parentComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_comment_id")
    private Comment replyToComment;

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private CommentStatus status;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "comment_id")
    private Integer commentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "content", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now(VIETNAM_ZONE);
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now(VIETNAM_ZONE);
    }

    public Comment() {
    }

    public Comment(Post post, User user, String content, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.post = post;
        this.user = user;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Integer getCommentId() {
        return commentId;
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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public boolean isDeleted() {
        return status == CommentStatus.DELETED;
    }

    public Comment getParentComment() {
        return parentComment;
    }

    public Comment getReplyToComment() {
        return replyToComment;
    }

    public String getStatus() {
        return status == null ? null : status.name();
    }

    public LocalDateTime getEditedAt() {
        return editedAt;
    }

    

    public void setParentComment(Comment parentComment) {
        this.parentComment = parentComment;
    }

    public void setReplyToComment(Comment replyToComment) {
        this.replyToComment = replyToComment;
    }

    public void setStatus(String status) {
        this.status = status == null ? null : CommentStatus.valueOf(status);
    }

    public CommentStatus getStatusValue() {
        return status;
    }

    public void setStatus(CommentStatus status) {
        this.status = status;
    }

    public void setEditedAt(LocalDateTime editedAt) {
        this.editedAt = editedAt;
    }
}
