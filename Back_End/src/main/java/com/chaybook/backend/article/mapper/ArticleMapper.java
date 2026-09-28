package com.chaybook.backend.article.mapper;

import com.chaybook.backend.article.dto.ArticleRequest;
import com.chaybook.backend.article.dto.ArticleResponse;
import com.chaybook.backend.article.dto.ArticleSummaryResponse;
import com.chaybook.backend.article.entity.Article;
import com.chaybook.backend.category.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class ArticleMapper {
    public ArticleSummaryResponse toSummary(Article article) {
        return ArticleSummaryResponse.builder()
                .articleId(article.getArticleId())
                .categoryId(categoryId(article))
                .createdBy(authorId(article))
                .title(article.getTitle())
                .coverImage(article.getCoverImage())
                .status(article.getStatus())
                .createdAt(article.getCreatedAt())
                .build();
    }

    public ArticleResponse toResponse(Article article) {
        return ArticleResponse.builder()
                .articleId(article.getArticleId())
                .categoryId(categoryId(article))
                .createdBy(authorId(article))
                .title(article.getTitle())
                .content(article.getContent())
                .coverImage(article.getCoverImage())
                .status(article.getStatus())
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .build();
    }

    public void updateEntity(Article article, ArticleRequest request, Category category) {
        article.setCategory(category);
        article.setTitle(request.title().trim());
        article.setContent(request.content());
        article.setCoverImage(request.coverImage());
        article.setStatus(request.status());
    }

    private Integer categoryId(Article article) {
        return article.getCategory() == null ? null : article.getCategory().getCategoryId();
    }

    private Integer authorId(Article article) {
        return article.getCreatedBy() == null ? null : article.getCreatedBy().getUserId();
    }
}
