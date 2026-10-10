package com.chaybook.backend.community.entity;

import com.chaybook.backend.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "[COMMENT]")
public class Comment {
    public static final String ACTIVE = "ACTIVE";
    public static final String DELETED = "DELETED";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private Comment parentComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_comment_id")
    private Comment replyToComment;

    @Column(name = "status", nullable = false, length = 20)
    private String status = ACTIVE;

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

    @org.hibernate.annotations.Nationalized
    @Column(name = "content", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

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
        return DELETED.equals(status);
    }

    public Comment getParentComment() {
        return parentComment;
    }

    public Comment getReplyToComment() {
        return replyToComment;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getEditedAt() {
        return editedAt;
    }
    
    public void editContent(String content) {
        this.content = content;
        this.editedAt = LocalDateTime.now();
    }

    public void softDelete() {
        this.status = DELETED;
        this.content = "";
    }

    public static Comment create(
        Post post,
        User author,
        String content,
        Comment parentComment,
        Comment replyToComment
    ) {
        Comment comment = new Comment();
        comment.post = post;
        comment.user = author;
        comment.content = content;
        comment.parentComment = parentComment;
        comment.replyToComment = replyToComment;
        comment.status = ACTIVE;
        return comment;
    }
}
