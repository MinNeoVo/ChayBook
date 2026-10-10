package com.chaybook.backend.community.service;

import com.chaybook.backend.community.dto.*;
import com.chaybook.backend.community.entity.Comment;
import com.chaybook.backend.community.entity.Post;
import com.chaybook.backend.community.exception.CommentException;
import com.chaybook.backend.community.repository.CommentRepository;
import com.chaybook.backend.community.repository.PostRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class CommentIService implements CommentService {

    private static final int MAX_PAGE_SIZE = 50;

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public CommentIService(
            CommentRepository commentRepository,
            PostRepository postRepository,
            UserRepository userRepository
    ) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @Override
    public CommentPageResponse listRoots(
            Integer postId,
            Integer userId,
            int page,
            int size
    ) {
        User viewer = requireMember(userId);
        Post post = requireApprovedPost(postId, false);
        validatePagination(page, size);

        Page<Comment> result = commentRepository.findRootComments(
                postId,
                PageRequest.of(page, size)
        );

        return toPageResponse(result, post, viewer);
    }

    @Override
    public CommentPageResponse listReplies(
            Integer postId,
            Integer rootId,
            Integer userId,
            int page,
            int size
    ) {
        User viewer = requireMember(userId);
        Post post = requireApprovedPost(postId, false);
        validatePagination(page, size);

        Comment root = requireComment(postId, rootId);

        if (root.getParentComment() != null) {
            throw error(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ROOT",
                    "rootId phải là ID của comment gốc"
            );
        }

        Page<Comment> result = commentRepository.findReplies(
                postId,
                rootId,
                PageRequest.of(page, size)
        );

        return toPageResponse(result, post, viewer);
    }

    @Override
    @Transactional
    public CommentMutationResponse create(
            Integer postId,
            Integer userId,
            CommentCreateRequest request
    ) {
        User author = requireMember(userId);
        Post post = requireApprovedPost(postId, true);

        Comment target = null;
        Comment root = null;

        if (request.replyToCommentId() != null) {
            target = requireComment(postId, request.replyToCommentId());

            if (target.isDeleted()) {
                throw error(
                        HttpStatus.CONFLICT,
                        "COMMENT_DELETED",
                        "Comment bạn muốn trả lời đã bị xóa"
                );
            }

            root = rootOf(target);

            if (root.isDeleted()) {
                throw error(
                        HttpStatus.CONFLICT,
                        "THREAD_CLOSED",
                        "Nhóm bình luận này không nhận trả lời mới"
                );
            }
        }

        Comment comment = Comment.create(
                post,
                author,
                request.content().strip(),
                root,
                target
        );

        Comment saved = commentRepository.saveAndFlush(comment);

        return toMutationResponse(saved, post, author);
    }

    @Override
    @Transactional
    public CommentMutationResponse update(
            Integer postId,
            Integer commentId,
            Integer userId,
            CommentUpdateRequest request
    ) {
        User actor = requireMember(userId);
        Post post = requireApprovedPost(postId, true);
        Comment comment = requireComment(postId, commentId);

        if (!isAuthor(comment, actor)) {
            throw error(
                    HttpStatus.FORBIDDEN,
                    "EDIT_FORBIDDEN",
                    "Bạn chỉ được sửa comment của mình"
            );
        }

        if (comment.isDeleted()) {
            throw error(
                    HttpStatus.CONFLICT,
                    "COMMENT_DELETED",
                    "Comment này đã bị xóa"
            );
        }

        String content = request.content().strip();

        if (!content.equals(comment.getContent())) {
            comment.editContent(content);
            commentRepository.saveAndFlush(comment);
        }

        return toMutationResponse(comment, post, actor);
    }

    @Override
    @Transactional
    public CommentMutationResponse delete(
            Integer postId,
            Integer commentId,
            Integer userId
    ) {
        User actor = requireMember(userId);
        Post post = requireApprovedPost(postId, true);
        Comment comment = requireComment(postId, commentId);

        if (!canDelete(comment, post, actor)) {
            throw error(
                    HttpStatus.FORBIDDEN,
                    "DELETE_FORBIDDEN",
                    "Bạn không có quyền xóa comment này"
            );
        }

        // Gửi lại cùng yêu cầu DELETE vẫn cho kết quả ổn định.
        if (!comment.isDeleted()) {
            comment.softDelete();
            commentRepository.saveAndFlush(comment);
        }

        return toMutationResponse(comment, post, actor);
    }

    private User requireMember(Integer userId) {
        if (userId == null || userId <= 0) {
            throw error(
                    HttpStatus.UNAUTHORIZED,
                    "AUTH_REQUIRED",
                    "Bạn cần đăng nhập"
            );
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> error(
                        HttpStatus.UNAUTHORIZED,
                        "AUTH_REQUIRED",
                        "Tài khoản không còn tồn tại"
                ));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw error(
                    HttpStatus.FORBIDDEN,
                    "ACCOUNT_INACTIVE",
                    "Tài khoản đã bị khóa"
            );
        }

        boolean allowedRole =
                "USER".equalsIgnoreCase(user.getRole())
                        || "ADMIN".equalsIgnoreCase(user.getRole());

        if (!allowedRole) {
            throw error(
                    HttpStatus.FORBIDDEN,
                    "ROLE_FORBIDDEN",
                    "Tài khoản không có quyền sử dụng chức năng này"
            );
        }

        return user;
    }

    private Post requireApprovedPost(Integer postId, boolean forWrite) {
        requirePositiveId(postId, "postId");

        Post post = (forWrite
                ? postRepository.findByIdForUpdate(postId)
                : postRepository.findById(postId))
                .orElseThrow(() -> error(
                        HttpStatus.NOT_FOUND,
                        "POST_NOT_FOUND",
                        "Không tìm thấy bài viết"
                ));

        if (!"APPROVED".equalsIgnoreCase(post.getStatus())) {
            throw error(
                    HttpStatus.NOT_FOUND,
                    "POST_NOT_FOUND",
                    "Không tìm thấy bài viết"
            );
        }

        return post;
    }

    private Comment requireComment(
            Integer postId,
            Integer commentId
    ) {
        requirePositiveId(commentId, "commentId");

        return commentRepository.findInPost(postId, commentId)
                .orElseThrow(() -> error(
                        HttpStatus.NOT_FOUND,
                        "COMMENT_NOT_FOUND",
                        "Không tìm thấy comment trong bài viết này"
                ));
    }

    private void requirePositiveId(Integer value, String name) {
        if (value == null || value <= 0) {
            throw error(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ID",
                    name + " phải lớn hơn 0"
            );
        }
    }

    private void validatePagination(int page, int size) {
        if (page < 0
                || size < 1
                || size > MAX_PAGE_SIZE
                || (long) page * size > Integer.MAX_VALUE) {
            throw error(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PAGE",
                    "page phải từ 0; size phải từ 1 đến 50"
            );
        }
    }

    private Comment rootOf(Comment comment) {
        return comment.getParentComment() == null
                ? comment
                : comment.getParentComment();
    }

    private boolean isAuthor(Comment comment, User user) {
        return user != null
                && comment.getUser() != null
                && Objects.equals(
                        comment.getUser().getUserId(),
                        user.getUserId()
                );
    }

    private boolean isPostOwner(Post post, User user) {
        return user != null
                && post.getUser() != null
                && Objects.equals(
                        post.getUser().getUserId(),
                        user.getUserId()
                );
    }

    private boolean canDelete(
            Comment comment,
            Post post,
            User user
    ) {
        return user != null
                && (
                    isAuthor(comment, user)
                    || isPostOwner(post, user)
                    || "ADMIN".equalsIgnoreCase(user.getRole())
                );
    }

    private CommentResponse.Author toAuthor(User user) {
        if (user == null) {
            return null;
        }

        String displayName = user.getFullName();

        if (displayName == null || displayName.isBlank()) {
            displayName = user.getUsername();
        }

        return new CommentResponse.Author(
                user.getUserId(),
                displayName,
                user.getAvatarUrl()
        );
    }

    private CommentResponse toResponse(
            Comment comment,
            Post post,
            User viewer,
            long replyCount
    ) {
        boolean deleted = comment.isDeleted();
        Comment root = rootOf(comment);
        Comment target = comment.getReplyToComment();

        CommentResponse.ReplyTarget replyTo = null;

        if (!deleted && target != null) {
            replyTo = new CommentResponse.ReplyTarget(
                    target.getCommentId(),
                    target.isDeleted() ? null : toAuthor(target.getUser()),
                    target.isDeleted()
            );
        }

        return new CommentResponse(
                comment.getCommentId(),
                post.getPostId(),
                comment.getParentComment() == null
                        ? null
                        : root.getCommentId(),
                deleted ? null : toAuthor(comment.getUser()),
                deleted ? null : comment.getContent(),
                comment.getStatus(),
                comment.getCreatedAt(),
                comment.getUpdatedAt(),
                comment.getEditedAt(),
                replyTo,
                replyCount,
                new CommentResponse.Permissions(
                        viewer != null && !deleted && !root.isDeleted(),
                        !deleted && isAuthor(comment, viewer),
                        !deleted && canDelete(comment, post, viewer)
                )
        );
    }

    private CommentPageResponse toPageResponse(
        Page<Comment> result,
        Post post,
        User viewer
    ) {
        List<Integer> rootIds = result.getContent().stream()
                .filter(comment -> comment.getParentComment() == null)
                .map(Comment::getCommentId)
                .toList();

        Map<Integer, Long> replyCounts = new HashMap<>();

        if (!rootIds.isEmpty()) {
                for (CommentRepository.ReplyCount count
                        : commentRepository.findReplyCounts(rootIds)) {
                replyCounts.put(count.getRootId(), count.getTotal());
                }
        }

        List<CommentResponse> items = result.getContent().stream()
                .map(comment -> toResponse(
                        comment,
                        post,
                        viewer,
                        replyCounts.getOrDefault(comment.getCommentId(), 0L)
                ))
                .toList();

        long totalCommentCount =
                commentRepository.countByPost_PostIdAndStatus(
                        post.getPostId(),
                        Comment.ACTIVE
                );

        return new CommentPageResponse(
                items,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.hasNext(),
                totalCommentCount
        );
    }

    private CommentMutationResponse toMutationResponse(
            Comment comment,
            Post post,
            User viewer
    ) {
        Comment root = rootOf(comment);

        long rootReplyCount =
                commentRepository.countByParentComment_CommentIdAndStatus(
                        root.getCommentId(),
                        Comment.ACTIVE
                );

        long totalCommentCount =
                commentRepository.countByPost_PostIdAndStatus(
                        post.getPostId(),
                        Comment.ACTIVE
                );

        boolean rootVisible = !root.isDeleted() || rootReplyCount > 0;

        return new CommentMutationResponse(
                toResponse(
                        comment,
                        post,
                        viewer,
                        comment.getParentComment() == null
                                ? rootReplyCount
                                : 0
                ),
                root.getCommentId(),
                rootReplyCount,
                rootVisible,
                totalCommentCount
        );
    }

    private CommentException error(
            HttpStatus status,
            String code,
            String message
    ) {
        return new CommentException(status, code, message);
    }
}