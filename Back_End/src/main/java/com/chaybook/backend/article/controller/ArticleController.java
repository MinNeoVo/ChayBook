package com.chaybook.backend.article.controller;

import com.chaybook.backend.article.service.ArticleService;
import com.chaybook.backend.article.dto.ArticleResponse;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    public ResponseEntity<Page<ArticleResponse>> getArticles(
            @RequestParam(name = "categoryId", required = false)
            Integer categoryId,

            @RequestParam(name = "status", required = false)
            String status,

            @RequestParam(name = "page", defaultValue = "0")
            int page,

            @RequestParam(name = "size", defaultValue = "10")
            int size
    ) {
        return ResponseEntity.ok(
                articleService.getArticles(
                        categoryId,
                        status,
                        page,
                        size
                )
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
}