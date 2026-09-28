package com.chaybook.backend.article.service;

import com.chaybook.backend.article.dto.ArticleRequest;
import com.chaybook.backend.article.dto.ArticleResponse;
import com.chaybook.backend.article.dto.ArticleSummaryResponse;

import java.util.List;

public interface ArticleIService {
    List<ArticleSummaryResponse> getArticles(Integer categoryId, String status);
    ArticleResponse getArticle(Integer articleId);
    ArticleResponse createArticle(ArticleRequest request);
    ArticleResponse updateArticle(Integer articleId, ArticleRequest request);
    void deleteArticle(Integer articleId);
}
