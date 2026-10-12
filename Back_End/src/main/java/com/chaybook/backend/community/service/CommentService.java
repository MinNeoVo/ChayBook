package com.chaybook.backend.community.service;

import com.chaybook.backend.community.dto.CommentCreateRequest;
import com.chaybook.backend.community.dto.CommentMutationResponse;
import com.chaybook.backend.community.dto.CommentPageResponse;
import com.chaybook.backend.community.dto.CommentUpdateRequest;

public interface CommentService {
    CommentPageResponse listRoots(
            Integer postId,
            Integer userId,
            int page,
            int size
    );

    CommentPageResponse listReplies(
            Integer postId,
            Integer rootId,
            Integer userId,
            int page,
            int size
    );

    CommentMutationResponse create(
            Integer postId,
            Integer userId,
            CommentCreateRequest request
    );

    CommentMutationResponse update(
            Integer postId,
            Integer commentId,
            Integer userId,
            CommentUpdateRequest request
    );

    CommentMutationResponse delete(
            Integer postId,
            Integer commentId,
            Integer userId
    );
}