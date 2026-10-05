package com.chaybook.backend.article.service;

import java.util.List;

public interface ArticleIService {

    List<ArticleResponse> getArticles(
            Integer categoryId,
            String status
    );

    ArticleResponse getArticleDetail(
            Integer articleId
    );

    ArticleResponse createArticle(
            Integer authenticatedUserId,
            ArticleRequest request
    );

    ArticleResponse updateArticle(
            Integer articleId,
            Integer authenticatedUserId,
            ArticleRequest request
    );

    void deleteArticle(
            Integer articleId,
            Integer authenticatedUserId
    );
}