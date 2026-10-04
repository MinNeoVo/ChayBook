package com.chaybook.backend.community.controller;

import com.chaybook.backend.community.dto.*;
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
import org.springframework.web.multipart.MultipartFile;

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

   
@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<PostCreateResponse> createPost(
        @RequestParam("categoryId") Integer categoryId,
        @RequestParam("title") String title,
        @RequestParam("content") String content,
        @RequestParam(value = "image", required = false)
        MultipartFile image,
        @AuthenticationPrincipal Jwt jwt
) {
    Integer currentUserId = getCurrentUserId(jwt);

    PostCreateResponse response = postService.createPost(
            currentUserId,
            categoryId,
            title,
            content,
            image
    );

    return ResponseEntity
            .status(HttpStatus.CREATED)
            .cacheControl(CacheControl.noStore())
            .body(response);
}

    @PutMapping(
            value = "/{postId}",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<PostMessageResponse> updatePost(
            @PathVariable("postId") Integer postId,
            @Valid @RequestBody PostUpdateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Integer currentUserId = getCurrentUserId(jwt);

        PostMessageResponse response = postService.updatePost(
                postId,
                currentUserId,
                request
        );

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<PostMessageResponse> deletePost(
            @PathVariable("postId") Integer postId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Integer currentUserId = getCurrentUserId(jwt);

        PostMessageResponse response = postService.deletePost(
                postId,
                currentUserId
        );

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }


    @DeleteMapping("/{postId}/interactions")
    public ResponseEntity<PostInteractionResponse> removeInteraction(
            @PathVariable("postId") Integer postId,
            @RequestParam("type") String type,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Integer currentUserId = getCurrentUserId(jwt);

        PostInteractionResponse response =
                postService.removeInteraction(
                        postId,
                        currentUserId,
                        type
                );

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }
}
