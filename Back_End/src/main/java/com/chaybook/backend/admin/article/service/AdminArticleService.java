package com.chaybook.backend.admin.article.service;

import com.chaybook.backend.admin.article.dto.AdminArticleRequest;
import com.chaybook.backend.admin.article.dto.AdminArticleResponse;
import com.chaybook.backend.common.pagination.PageResponse;

public interface AdminArticleService {

    PageResponse<AdminArticleResponse.Summary> getArticles(
            Integer authenticatedUserId,
            String q,
            Integer categoryId,
            String status,
            int page,
            int size
    );

    AdminArticleResponse getArticleDetail(
            Integer authenticatedUserId,
            Integer articleId
    );

    AdminArticleResponse createArticle(
            Integer authenticatedUserId,
            AdminArticleRequest request
    );

    AdminArticleResponse updateArticle(
            Integer authenticatedUserId,
            Integer articleId,
            AdminArticleRequest request
    );

    void deleteArticle(
            Integer authenticatedUserId,
            Integer articleId
    );
}