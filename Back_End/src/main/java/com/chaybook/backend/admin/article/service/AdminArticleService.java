package com.chaybook.backend.admin.article.service;

import java.util.Locale;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.chaybook.backend.admin.article.repository.AdminArticleRepository;
import com.chaybook.backend.admin.category.repository.AdminCategoryRepository;
import com.chaybook.backend.article.entity.Article;
import com.chaybook.backend.category.entity.Category;
import com.chaybook.backend.common.pagination.PageResponse;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;

@Service 
@Transactional (readOnly = true)
public class AdminArticleService implements AdminArticleIService {

    private final AdminArticleRepository articleRepository;
    private final AdminCategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public AdminArticleService(
            AdminArticleRepository articleRepository,
            AdminCategoryRepository categoryRepository,
            UserRepository userRepository
    ) {
        this.articleRepository = articleRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    //
    private User requireAdmin(Integer authenticatedUserId) {
    if (authenticatedUserId == null || authenticatedUserId <= 0) {
        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Vui lòng đăng nhập"
        );
    }

    User user = userRepository.findById(authenticatedUserId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Tài khoản không còn tồn tại"
            ));

    if (!"ACTIVE".equals(user.getStatus())
            || !"ADMIN".equals(user.getRole())) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Chỉ Admin ACTIVE được thực hiện thao tác này"
            );
        }
        return user;
    }

    private Article requireArticle(Integer articleId) {
        if (articleId == null || articleId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Article ID phải lớn hơn 0"
            );
        }
        return articleRepository.findById(articleId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Article không tồn tại"
                ));
    }

    private Category requireArticleCategory(Integer categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category không tồn tại"
                ));

        if (!"ARTICLE".equals(category.getType())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Article phải thuộc Category loại ARTICLE"
            );
        }

        return category;
    }

    private void applyArticleFields(
            Article article,
            Category category,
            AdminArticleRequest request
    ) {
        article.setCategory(category);
        article.setTitle(request.title().strip());
        article.setContent(request.content());
        article.setCoverImage(request.coverImage());
        article.setStatus(request.status());
    }

    private String normalizeOptionalStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        String normalized = status.strip().toUpperCase(Locale.ROOT);

        if (!Set.of("DRAFT", "PUBLISHED").contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Article status không hợp lệ"
            );
        }
        return normalized;
    }

    //mapper
    private AdminArticleResponse toResponse(Article article) {
        return new AdminArticleResponse(
                article.getArticleId(),
                article.getCategory() == null
                        ? null : article.getCategory().getCategoryId(),
                article.getCreatedBy() == null
                        ? null : article.getCreatedBy().getUserId(),
                article.getTitle(),
                article.getContent(),
                article.getCoverImage(),
                article.getStatus(),
                article.getCreatedAt(),
                article.getUpdatedAt()
        );
    }

    private AdminArticleResponse.Summary toSummary(Article article) {
        return new AdminArticleResponse.Summary(
                article.getArticleId(),
                article.getCategory() == null
                        ? null : article.getCategory().getCategoryId(),
                article.getTitle(),
                article.getCoverImage(),
                article.getStatus(),
                article.getUpdatedAt()
        );
    }

    //list
    @Override
    public PageResponse<AdminArticleResponse.Summary> getArticles(
            Integer authenticatedUserId,
            String q,
            Integer categoryId,
            String status,
            int page,
            int size
    ) {
        requireAdmin(authenticatedUserId);

        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Page phải từ 0; size phải từ 1 đến 100"
            );
        }

        if (categoryId != null && categoryId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Category ID phải lớn hơn 0"
            );
        }

        String keyword = q == null || q.isBlank() ? null : q.strip();
        String normalizedStatus = normalizeOptionalStatus(status);

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "articleId")
        );

        Page<Article> articles = articleRepository.search(
                keyword,
                categoryId,
                normalizedStatus,
                pageable
        );

        return PageResponse.from(articles.map(this::toSummary));
    }

    //detail
    @Override
    public AdminArticleResponse getArticleDetail(
            Integer authenticatedUserId,
            Integer articleId
    ) {
        requireAdmin(authenticatedUserId);
        return toResponse(requireArticle(articleId));
    }

    //create
    @Override
    @Transactional
    public AdminArticleResponse createArticle(
            Integer authenticatedUserId,
            AdminArticleRequest request
    ) {
        User admin = requireAdmin(authenticatedUserId);
        Category category = requireArticleCategory(request.categoryId());

        Article article = new Article();

        applyArticleFields(article, category, request);
        article.setCreatedBy(admin);

        return toResponse(articleRepository.saveAndFlush(article));
    }

    //update
    @Override
    @Transactional
    public AdminArticleResponse updateArticle(
            Integer authenticatedUserId,
            Integer articleId,
            AdminArticleRequest request
    ) {
        requireAdmin(authenticatedUserId);

        Article article = requireArticle(articleId);
        Category category = requireArticleCategory(request.categoryId());

        applyArticleFields(article, category, request);

        return toResponse(articleRepository.saveAndFlush(article));
    }

    //delete
    @Override
    @Transactional
    public void deleteArticle(
            Integer authenticatedUserId,
            Integer articleId
    ) {
        requireAdmin(authenticatedUserId);

        Article article = requireArticle(articleId);

        articleRepository.delete(article);
        articleRepository.flush();
    }
}
