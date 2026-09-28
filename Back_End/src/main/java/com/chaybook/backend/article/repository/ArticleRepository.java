package com.chaybook.backend.article.repository;

import com.chaybook.backend.article.entity.Article;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Integer> {
    @EntityGraph(attributePaths = {"category", "createdBy"})
    @Query("""
            select a from Article a
            where (:categoryId is null or a.category.categoryId = :categoryId)
              and (:status is null or upper(a.status) = :status)
            order by a.createdAt desc, a.articleId desc
            """)
    List<Article> findByFilters(@Param("categoryId") Integer categoryId, @Param("status") String status);

    @Override
    @EntityGraph(attributePaths = {"category", "createdBy"})
    Optional<Article> findById(Integer articleId);
}
