package com.chaybook.backend.article.service.impl;

import com.chaybook.backend.article.dto.ArticleResponse;
import com.chaybook.backend.article.entity.Article;
import com.chaybook.backend.article.repository.ArticleRepository;
import com.chaybook.backend.article.service.ArticleService;
import com.chaybook.backend.category.repository.CategoryRepository;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class ArticleServiceImpl implements ArticleService {

    private final ArticleRepository articleRepository;
    private final CategoryRepository categoryRepository;

    public ArticleServiceImpl(
            ArticleRepository articleRepository,
            CategoryRepository categoryRepository
    ) {
        this.articleRepository = articleRepository;
        this.categoryRepository = categoryRepository;

    }

   @Override
public Page<ArticleResponse> getArticles(
        Integer categoryId,
        String status,
        int page,
        int size
) {
    if (page < 0 || size < 1 || size > 10) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Page phải từ 0; size phải từ 1 đến 10"
        );
    }

    if (categoryId != null && categoryId <= 0) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Category ID must be greater than 0"
        );
    }

    String normalizedStatus = normalizeStatus(status);

    Pageable pageable = PageRequest.of(
            page,
            size,
            Sort.by(Sort.Direction.DESC, "articleId")
    );

    Page<Article> articles;

    if (categoryId != null && normalizedStatus != null) {

        articles = articleRepository
                .findByCategory_CategoryIdAndStatus(
                        categoryId,
                        normalizedStatus,
                        pageable
                );

    } else if (categoryId != null) {

        articles = articleRepository
                .findByCategory_CategoryId(
                        categoryId,
                        pageable
                );

    } else if (normalizedStatus != null) {

        articles = articleRepository
                .findByStatus(
                        normalizedStatus,
                        pageable
                );

    } else {

        articles = articleRepository.findAll(pageable);
    }

    return articles.map(this::toResponse);
}

    @Override
    public ArticleResponse getArticleDetail(
            Integer articleId
    ) {
        Article article = requireArticle(articleId);

        return toResponse(article);
    }


    private Article requireArticle(Integer articleId) {
        if (articleId == null || articleId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Article ID must be greater than 0"
            );
        }

        return articleRepository.findById(articleId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Article not found"
                ));
    }


    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        String normalizedStatus = status.strip()
                .toUpperCase(Locale.ROOT);

        if (!"DRAFT".equals(normalizedStatus)
                && !"PUBLISHED".equals(normalizedStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status must be DRAFT or PUBLISHED"
            );
        }

        return normalizedStatus;
    }


    private ArticleResponse toResponse(Article article) {
        Integer categoryId = article.getCategory() == null
                ? null
                : article.getCategory().getCategoryId();

        Integer createdBy = article.getCreatedBy() == null
                ? null
                : article.getCreatedBy().getUserId();

        return new ArticleResponse(
                article.getArticleId(),
                categoryId,
                createdBy,
                article.getTitle(),
                article.getContent(),
                article.getCoverImage(),
                article.getStatus(),
                article.getCreatedAt(),
                article.getUpdatedAt()
        );
    }
}