package com.chaybook.backend.admin.article.controller;

import java.net.URI;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.chaybook.backend.admin.article.dto.AdminArticleRequest;
import com.chaybook.backend.admin.article.dto.AdminArticleResponse;
import com.chaybook.backend.admin.article.service.AdminArticleService;
import com.chaybook.backend.common.pagination.PageResponse;

import jakarta.validation.Valid;

@RestController 
@RequestMapping ("/api/admin/articles")
public class AdminArticleController {

    private final AdminArticleService articleService;

    public AdminArticleController(
            AdminArticleService articleService
    ) {
        this.articleService = articleService;
    }

    // Thêm requireAuthenticatedUserId
    private Integer requireAuthenticatedUserId(
        Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Vui lòng đăng nhập"
            );
        }

        try {
            Integer userId = Integer.valueOf(authentication.getName());

            if (userId <= 0) {
                throw new NumberFormatException();
            }

            return userId;
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Danh tính đăng nhập không hợp lệ"
            );
        }
    }

    //method
    @GetMapping
    public ResponseEntity<PageResponse<AdminArticleResponse.Summary>> getArticles(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "categoryId", required = false) Integer categoryId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            Authentication authentication
    ) {
        Integer userId = requireAuthenticatedUserId(authentication);

        return ResponseEntity.ok(
                articleService.getArticles(
                        userId, q, categoryId, status, page, size
                )
        );
    }

    @GetMapping("/{articleId}")
    public ResponseEntity<AdminArticleResponse> getArticleDetail(
            @PathVariable("articleId") Integer articleId,
            Authentication authentication
    ) {
        Integer userId = requireAuthenticatedUserId(authentication);

        AdminArticleResponse response =
                articleService.getArticleDetail(userId, articleId);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<AdminArticleResponse> createArticle(
            @Valid @RequestBody AdminArticleRequest request,
            Authentication authentication
    ) {
        Integer userId = requireAuthenticatedUserId(authentication);

        AdminArticleResponse response =
                articleService.createArticle(userId, request);

        URI location = URI.create(
                "/api/admin/articles/" + response.articleId()
        );

        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{articleId}")
    public ResponseEntity<AdminArticleResponse> updateArticle(
            @PathVariable("articleId") Integer articleId,
            @Valid @RequestBody AdminArticleRequest request,
            Authentication authentication
    ) {
        Integer userId = requireAuthenticatedUserId(authentication);

        AdminArticleResponse response =
                articleService.updateArticle(userId, articleId, request);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{articleId}")
    public ResponseEntity<Void> deleteArticle(
            @PathVariable("articleId") Integer articleId,
            Authentication authentication
    ) {
        Integer userId = requireAuthenticatedUserId(authentication);

        articleService.deleteArticle(userId, articleId);

        return ResponseEntity.noContent().build();
    }
}