package com.chaybook.backend.article.repository;

import com.chaybook.backend.article.entity.Article;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArticleRepository
        extends JpaRepository<Article, Integer> {

    List<Article> findByCategory_CategoryId(
            Integer categoryId,
            Sort sort
    );

    List<Article> findByStatus(
            String status,
            Sort sort
    );

    List<Article> findByCategory_CategoryIdAndStatus(
            Integer categoryId,
            String status,
            Sort sort
    );
}