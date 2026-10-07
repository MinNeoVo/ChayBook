package com.chaybook.backend.article.service;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ArticleIService {

    Page<ArticleResponse> getArticles(
        Integer categoryId,
        String status,
        int page,
        int size
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