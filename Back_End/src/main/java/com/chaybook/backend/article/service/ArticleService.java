package com.chaybook.backend.article.service;

import com.chaybook.backend.article.entity.Article;
import com.chaybook.backend.article.repository.ArticleRepository;
import com.chaybook.backend.category.entity.Category;
import com.chaybook.backend.category.repository.CategoryRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class ArticleService implements ArticleIService {

    private final ArticleRepository articleRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public ArticleService(
            ArticleRepository articleRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository
    ) {
        this.articleRepository = articleRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<ArticleResponse> getArticles(
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

        List<Article> articles;

        if (categoryId != null && normalizedStatus != null) {
            articles = articleRepository
                    .findByCategory_CategoryIdAndStatus(
                            categoryId,
                            normalizedStatus,
                            pageable
                    );
        } else if (categoryId != null) {
            articles = articleRepository
                    .findByCategory_CategoryId(categoryId, pageable);
        } else if (normalizedStatus != null) {
            articles = articleRepository
                    .findByStatus(normalizedStatus, pageable);
        } else {
            articles = articleRepository.findAll(pageable).getContent();
        }

        List<ArticleResponse> responses = new ArrayList<>();

        for (Article article : articles) {
            responses.add(toResponse(article));
        }

        return responses;
    }

    @Override
    public ArticleResponse getArticleDetail(
            Integer articleId
    ) {
        Article article = requireArticle(articleId);

        return toResponse(article);
    }

    @Override
    @Transactional
    public ArticleResponse createArticle(
            Integer authenticatedUserId,
            ArticleRequest request
    ) {
        User currentUser = requireAdmin(authenticatedUserId);
        Category category = requireArticleCategory(request.categoryId());

        Article article = new Article();

        applyArticleFields(article, category, request);
        article.setCreatedBy(currentUser);

        Article savedArticle = articleRepository.saveAndFlush(article);

        return toResponse(savedArticle);
    }

    @Override
    @Transactional
    public ArticleResponse updateArticle(
            Integer articleId,
            Integer authenticatedUserId,
            ArticleRequest request
    ) {
        requireAdmin(authenticatedUserId);

        Article article = requireArticle(articleId);
        Category category = requireArticleCategory(request.categoryId());

        applyArticleFields(article, category, request);

        Article savedArticle = articleRepository.saveAndFlush(article);

        return toResponse(savedArticle);
    }

    @Override
    @Transactional
    public void deleteArticle(
            Integer articleId,
            Integer authenticatedUserId
    ) {
        requireAdmin(authenticatedUserId);

        Article article = requireArticle(articleId);

        articleRepository.delete(article);
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

    private Category requireArticleCategory(Integer categoryId) {
        if (categoryId == null || categoryId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Category ID must be greater than 0"
            );
        }

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category not found"
                ));

        if (!"ARTICLE".equals(category.getType())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Category must have type ARTICLE"
            );
        }

        return category;
    }

    private User requireAdmin(Integer authenticatedUserId) {
        if (authenticatedUserId == null || authenticatedUserId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        User user = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Please log in again"
                ));

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account is not active"
            );
        }

        if (!"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only admins can manage articles"
            );
        }

        return user;
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

    private void applyArticleFields(
            Article article,
            Category category,
            ArticleRequest request
    ) {
        article.setCategory(category);
        article.setTitle(request.title().strip());
        article.setContent(request.content());
        article.setCoverImage(request.coverImage());
        article.setStatus(request.status());
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