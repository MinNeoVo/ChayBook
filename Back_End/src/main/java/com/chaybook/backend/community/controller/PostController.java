package com.chaybook.backend.community.controller;

import com.chaybook.backend.community.dto.PostCreateRequest;
import com.chaybook.backend.community.dto.PostCreateResponse;
import com.chaybook.backend.community.dto.PostResponse;
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

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(
        origins = "http://localhost:5173",
        allowCredentials = "true"
)
public class PostController {
    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public ResponseEntity<List<PostResponse>> getPosts(
            @RequestParam(
                    name = "categoryId",
                    required = false
            ) Integer categoryId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Integer currentUserId = getCurrentUserId(jwt);

        List<PostResponse> responses = postService.getPosts(
                categoryId,
                currentUserId
        );

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(responses);
    }

    private Integer getCurrentUserId(Jwt jwt) {
        if (jwt == null) {
            return null;
        }

        try {
            int userId = Integer.parseInt(jwt.getSubject());

            if (userId > 0) {
                return userId;
            }
        } catch (NumberFormatException exception) {
        }

        throw new PostException(
                HttpStatus.UNAUTHORIZED,
                "Invalid authentication information"
        );
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PostCreateResponse> createPost(
            @Valid @RequestBody PostCreateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Integer currentUserId = getCurrentUserId(jwt);

        PostCreateResponse response = postService.createPost(
                currentUserId,
                request
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .cacheControl(CacheControl.noStore())
                .body(response);
    }
}
