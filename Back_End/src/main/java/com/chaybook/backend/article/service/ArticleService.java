package com.chaybook.backend.article.service;

import com.chaybook.backend.article.dto.ArticleResponse;
import org.springframework.data.domain.Page;

public interface ArticleService {

    Page<ArticleResponse> getArticles(
            Integer categoryId,
            String status,
            int page,
            int size
    );

    ArticleResponse getArticleDetail(Integer articleId);
}