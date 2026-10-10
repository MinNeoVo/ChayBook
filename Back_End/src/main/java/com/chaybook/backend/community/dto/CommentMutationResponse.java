package com.chaybook.backend.community.dto;

public record CommentMutationResponse(
        CommentResponse comment,
        Integer rootCommentId,
        long rootReplyCount,
        boolean rootVisible,
        long totalCommentCount
) {
}