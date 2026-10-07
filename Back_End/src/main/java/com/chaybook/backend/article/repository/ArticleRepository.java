package com.chaybook.backend.article.repository;

import com.chaybook.backend.article.entity.Article;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArticleRepository
        extends JpaRepository<Article, Integer> {

    Page<Article> findByCategory_CategoryId(
            Integer categoryId,
            Pageable pageable
    );

    Page<Article> findByStatus(
            String status,
            Pageable pageable
    );

    Page<Article> findByCategory_CategoryIdAndStatus(
            Integer categoryId,
            String status,
            Pageable pageable
    );
}