package com.chaybook.backend.community.dto;

import java.time.LocalDateTime;

public record CommentResponse(
        Integer commentId,
        Integer postId,
        Integer parentCommentId,
        Author author,
        String content,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime editedAt,
        ReplyTarget replyTo,
        long replyCount,
        Permissions permissions
) {
    public record Author(
            Integer userId,
            String displayName,
            String avatarUrl
    ) {
    }

    public record ReplyTarget(
            Integer commentId,
            Author author,
            boolean deleted
    ) {
    }

    public record Permissions(
            boolean canReply,
            boolean canEdit,
            boolean canDelete
    ) {
    }
}