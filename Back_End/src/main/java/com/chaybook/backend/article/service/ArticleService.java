package com.chaybook.backend.article.service;

import com.chaybook.backend.article.dto.ArticleRequest;
import com.chaybook.backend.article.dto.ArticleResponse;
import com.chaybook.backend.article.dto.ArticleSummaryResponse;
import com.chaybook.backend.article.entity.Article;
import com.chaybook.backend.article.mapper.ArticleMapper;
import com.chaybook.backend.article.repository.ArticleRepository;
import com.chaybook.backend.article.service.ArticleIService;
import com.chaybook.backend.auth.service.CurrentUserProvider;
import com.chaybook.backend.category.entity.Category;
import com.chaybook.backend.category.repository.CategoryRepository;
import com.chaybook.backend.common.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class ArticleService implements ArticleIService {
    private final ArticleRepository articleRepository;
    private final CategoryRepository categoryRepository;
    private final ArticleMapper articleMapper;
    private final CurrentUserProvider currentUserProvider;

    public ArticleService(ArticleRepository articleRepository, CategoryRepository categoryRepository,
                              ArticleMapper articleMapper, CurrentUserProvider currentUserProvider) {
        this.articleRepository = articleRepository;
        this.categoryRepository = categoryRepository;
        this.articleMapper = articleMapper;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public List<ArticleSummaryResponse> getArticles(Integer categoryId, String status) {
        String normalizedStatus = StringUtils.hasText(status) ? status.trim().toUpperCase(Locale.ROOT) : null;
        return articleRepository.findByFilters(categoryId, normalizedStatus)
                .stream().map(articleMapper::toSummary).toList();
    }

    @Override
    public ArticleResponse getArticle(Integer articleId) {
        return articleMapper.toResponse(findArticle(articleId));
    }

    @Override
    @Transactional
    public ArticleResponse createArticle(ArticleRequest request) {
        var admin = currentUserProvider.requireAdmin();
        Category category = findArticleCategory(request.categoryId());
        Article article = new Article();
        articleMapper.updateEntity(article, request, category);
        article.setCreatedBy(admin);
        return articleMapper.toResponse(articleRepository.saveAndFlush(article));
    }

    @Override
    @Transactional
    public ArticleResponse updateArticle(Integer articleId, ArticleRequest request) {
        currentUserProvider.requireAdmin();
        Article article = findArticle(articleId);
        Category category = findArticleCategory(request.categoryId());
        articleMapper.updateEntity(article, request, category);
        return articleMapper.toResponse(articleRepository.saveAndFlush(article));
    }

    @Override
    @Transactional
    public void deleteArticle(Integer articleId) {
        currentUserProvider.requireAdmin();
        articleRepository.delete(findArticle(articleId));
        articleRepository.flush();
    }

    private Article findArticle(Integer articleId) {
        return articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Article", articleId));
    }

    private Category findArticleCategory(Integer categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));
        if (!"ARTICLE".equalsIgnoreCase(category.getType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category type must be ARTICLE");
        }
        return category;
    }
}
