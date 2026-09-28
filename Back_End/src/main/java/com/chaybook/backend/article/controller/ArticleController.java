package com.chaybook.backend.article.controller;

import com.chaybook.backend.article.dto.ArticleRequest;
import com.chaybook.backend.article.dto.ArticleResponse;
import com.chaybook.backend.article.dto.ArticleSummaryResponse;
import com.chaybook.backend.article.service.ArticleService;
import com.chaybook.backend.common.dto.MessageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {
    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    public List<ArticleSummaryResponse> getArticles(
            @RequestParam(required = false) @Positive Integer categoryId,
            @RequestParam(required = false) String status) {
        return articleService.getArticles(categoryId, status);
    }

    @GetMapping("/{articleId}")
    public ArticleResponse getArticle(@PathVariable @Positive Integer articleId) {
        return articleService.getArticle(articleId);
    }

    @PostMapping
    public ResponseEntity<ArticleResponse> createArticle(@Valid @RequestBody ArticleRequest request) {
        ArticleResponse response = articleService.createArticle(request);
        return ResponseEntity.created(URI.create("/api/articles/" + response.articleId())).body(response);
    }

    @PutMapping("/{articleId}")
    public ArticleResponse updateArticle(@PathVariable @Positive Integer articleId,
                                         @Valid @RequestBody ArticleRequest request) {
        return articleService.updateArticle(articleId, request);
    }

    @DeleteMapping("/{articleId}")
    public MessageResponse deleteArticle(@PathVariable @Positive Integer articleId) {
        articleService.deleteArticle(articleId);
        return MessageResponse.builder().message("Article deleted successfully").build();
    }
}
