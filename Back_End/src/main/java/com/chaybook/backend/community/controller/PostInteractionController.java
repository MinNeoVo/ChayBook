package com.chaybook.backend.community.controller;

import com.chaybook.backend.community.dto.PostInteractionRequest;
import com.chaybook.backend.community.dto.PostInteractionResponse;
import com.chaybook.backend.community.exception.PostException;
import com.chaybook.backend.community.service.PostService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/{postId}/interactions")
@CrossOrigin(
        origins = "http://localhost:5173",
        allowCredentials = "true"
)
public class PostInteractionController {
    private final PostService postService;

    public PostInteractionController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PostInteractionResponse> addInteraction(
            @PathVariable("postId") Integer postId,
            @Valid @RequestBody PostInteractionRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Integer currentUserId = requireCurrentUserId(jwt);

        PostInteractionResponse response = postService.addInteraction(
                postId,
                currentUserId,
                request
        );

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    private Integer requireCurrentUserId(Jwt jwt) {
        if (jwt != null) {
            try {
                int userId = Integer.parseInt(jwt.getSubject());

                if (userId > 0) {
                    return userId;
                }
            } catch (NumberFormatException exception) {
                // Subject không phải userId hợp lệ.
            }
        }

        throw new PostException(
                HttpStatus.UNAUTHORIZED,
                "Please log in with a valid account"
        );
    }
}
