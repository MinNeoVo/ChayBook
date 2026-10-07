package com.chaybook.backend.admin.article.repository;

import com.chaybook.backend.article.entity.Article;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface AdminArticleRepository
        extends JpaRepository<Article, Integer> {

    @Query("""
        select a
        from Article a
        left join a.category c
        where (:q is null
            or locate(lower(:q), lower(a.title)) > 0)
          and (:categoryId is null or c.categoryId = :categoryId)
          and (:status is null or a.status = :status)
        """)
    Page<Article> search(
            @Param("q") String q,
            @Param("categoryId") Integer categoryId,
            @Param("status") String status,
            Pageable pageable
    );
}