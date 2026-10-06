package com.chaybook.backend.admin.category.repository;

import com.chaybook.backend.category.entity.Category;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AdminCategoryRepository
        extends JpaRepository<Category, Integer> {

    List<Category> findByNameContainingIgnoreCase(
            String q,
            Sort sort
    );

    List<Category> findByTypeIgnoreCaseAndNameContainingIgnoreCase(
            String type,
            String q,
            Sort sort
    );

    @Query("""
        select count(c)
        from Category c
        where lower(trim(c.name)) = lower(:name)
          and upper(trim(c.type)) = :type
          and (:excludedId is null or c.categoryId <> :excludedId)
        """)
    long countDuplicates(
            @Param("name") String name,
            @Param("type") String type,
            @Param("excludedId") Integer excludedId
    );

    @Query(value = """
        SELECT CASE WHEN
            EXISTS (
                SELECT 1 FROM ARTICLE WHERE category_id = :id
            )
            OR EXISTS (
                SELECT 1 FROM RECIPE WHERE category_id = :id
            )
            OR EXISTS (
                SELECT 1 FROM POST WHERE category_id = :id
            )
            OR EXISTS (
                SELECT 1 FROM VIDEO WHERE category_id = :id
            )
        THEN 1 ELSE 0 END
        """, nativeQuery = true)
    int findUsageFlag(@Param("id") Integer categoryId);
}