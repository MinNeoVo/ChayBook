package com.chaybook.backend.community.controller;

import com.chaybook.backend.community.dto.*;
import com.chaybook.backend.community.exception.CommentException;
import com.chaybook.backend.community.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public ResponseEntity<CommentPageResponse> listRoots(
            @PathVariable Integer postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ok(commentService.listRoots(
                postId,
                userId(jwt),
                page,
                size
        ));
    }

    @GetMapping("/{rootId}/replies")
    public ResponseEntity<CommentPageResponse> listReplies(
            @PathVariable Integer postId,
            @PathVariable Integer rootId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ok(commentService.listReplies(
                postId,
                rootId,
                userId(jwt),
                page,
                size
        ));
    }

    @PostMapping
    public ResponseEntity<CommentMutationResponse> create(
            @PathVariable Integer postId,
            @Valid @RequestBody CommentCreateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .cacheControl(CacheControl.noStore())
                .body(commentService.create(
                        postId,
                        userId(jwt),
                        request
                ));
    }

    @PatchMapping("/{commentId}")
    public ResponseEntity<CommentMutationResponse> update(
            @PathVariable Integer postId,
            @PathVariable Integer commentId,
            @Valid @RequestBody CommentUpdateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ok(commentService.update(
                postId,
                commentId,
                userId(jwt),
                request
        ));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<CommentMutationResponse> delete(
            @PathVariable Integer postId,
            @PathVariable Integer commentId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ok(commentService.delete(
                postId,
                commentId,
                userId(jwt)
        ));
    }

    private Integer userId(Jwt jwt) {
        if (jwt == null) {
            throw unauthorized();
        }

        try {
            int id = Integer.parseInt(jwt.getSubject());

            if (id <= 0) {
                throw unauthorized();
            }

            return id;
        } catch (NumberFormatException exception) {
            throw unauthorized();
        }
    }

    private CommentException unauthorized() {
        return new CommentException(
                HttpStatus.UNAUTHORIZED,
                "AUTH_REQUIRED",
                "Bạn cần đăng nhập lại"
        );
    }

    private <T> ResponseEntity<T> ok(T body) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(body);
    }
}