package com.chaybook.backend.article.controller;

import com.chaybook.backend.article.service.ArticleIService;
import com.chaybook.backend.article.service.ArticleRequest;
import com.chaybook.backend.article.service.ArticleResponse;
import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
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

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    private final ArticleIService articleService;

    public ArticleController(ArticleIService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
public ResponseEntity<Page<ArticleResponse>> getArticles(
        @RequestParam(name = "categoryId", required = false) Integer categoryId,
        @RequestParam(name = "status", required = false) String status,
        @RequestParam(name = "page", defaultValue = "0") int page,
        @RequestParam(name = "size", defaultValue = "10") int size
) {
    return ResponseEntity.ok(
            articleService.getArticles(categoryId, status, page, size)
    );
}

    @GetMapping("/{articleId}")
    public ResponseEntity<ArticleResponse> getArticleDetail(
            @PathVariable("articleId") Integer articleId
    ) {
        return ResponseEntity.ok(
                articleService.getArticleDetail(articleId)
        );
    }

    @PostMapping
    public ResponseEntity<ArticleResponse> createArticle(
            @Valid @RequestBody ArticleRequest request,
            Authentication authentication
    ) {
        Integer authenticatedUserId =
                requireAuthenticatedUserId(authentication);

        ArticleResponse response = articleService.createArticle(
                authenticatedUserId,
                request
        );

        return ResponseEntity
                .created(URI.create("/api/articles/" + response.articleId()))
                .body(response);
    }

    @PutMapping("/{articleId}")
    public ResponseEntity<ArticleResponse> updateArticle(
            @PathVariable("articleId") Integer articleId,
            @Valid @RequestBody ArticleRequest request,
            Authentication authentication
    ) {
        Integer authenticatedUserId =
                requireAuthenticatedUserId(authentication);

        return ResponseEntity.ok(
                articleService.updateArticle(
                        articleId,
                        authenticatedUserId,
                        request
                )
        );
    }

    @DeleteMapping("/{articleId}")
    public ResponseEntity<Map<String, String>> deleteArticle(
            @PathVariable("articleId") Integer articleId,
            Authentication authentication
    ) {
        Integer authenticatedUserId =
                requireAuthenticatedUserId(authentication);

        articleService.deleteArticle(
                articleId,
                authenticatedUserId
        );

        return ResponseEntity.ok(
                Map.of("message", "Article deleted successfully")
        );
    }

    private Integer requireAuthenticatedUserId(
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        try {
            return Integer.valueOf(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid authenticated user ID"
            );
        }
    }
}