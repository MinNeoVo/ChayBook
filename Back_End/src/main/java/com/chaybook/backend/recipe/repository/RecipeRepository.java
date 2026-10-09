package com.chaybook.backend.recipe.repository;

import com.chaybook.backend.recipe.entity.Recipe;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecipeRepository extends JpaRepository<Recipe, Integer> {

    // chỉ lấy Recipe ACTIVE.
    // Không lọc status của Category.
    @Query("""
            SELECT r
            FROM Recipe r
            LEFT JOIN FETCH r.category c
            WHERE r.status = 'ACTIVE'
              AND (:categoryId IS NULL OR c.categoryId = :categoryId)
              AND (
                  :keyword IS NULL
                  OR LOCATE(LOWER(:keyword), LOWER(r.name)) > 0
              )
            ORDER BY r.recipeId ASC
            """)
    Page<Recipe> searchRecipes(
            @Param("categoryId") Integer categoryId,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    // Customer: Recipe DELETED sẽ không được tìm thấy.
    @Query("""
            SELECT r
            FROM Recipe r
            LEFT JOIN FETCH r.category
            WHERE r.recipeId = :recipeId
              AND r.status = 'ACTIVE'
            """)
    Optional<Recipe> findDetailById(
            @Param("recipeId") Integer recipeId
    );

    // Admin ghi dữ liệu: phải tìm được cả Recipe DELETED
    // để DELETE lặp lại vẫn thành công.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT r
            FROM Recipe r
            WHERE r.recipeId = :recipeId
            """)
    Optional<Recipe> findByIdForUpdate(
            @Param("recipeId") Integer recipeId
    );

    // Dùng cho tạo thực đơn và lấy dữ liệu chatbot.
    List<Recipe> findByStatus(String status);

    // Admin: không gửi status thì lấy cả ACTIVE và DELETED.
    @Query(
            value = """
                    SELECT r
                    FROM Recipe r
                    LEFT JOIN FETCH r.category c
                    WHERE (:status IS NULL OR r.status = :status)
                      AND (
                          :categoryId IS NULL
                          OR c.categoryId = :categoryId
                      )
                      AND (
                          :keyword IS NULL
                          OR LOCATE(LOWER(:keyword), LOWER(r.name)) > 0
                      )
                    ORDER BY r.recipeId DESC
                    """,
            countQuery = """
                    SELECT COUNT(r)
                    FROM Recipe r
                    LEFT JOIN r.category c
                    WHERE (:status IS NULL OR r.status = :status)
                      AND (
                          :categoryId IS NULL
                          OR c.categoryId = :categoryId
                      )
                      AND (
                          :keyword IS NULL
                          OR LOCATE(LOWER(:keyword), LOWER(r.name)) > 0
                      )
                    """
    )
    Page<Recipe> searchForAdmin(
            @Param("categoryId") Integer categoryId,
            @Param("keyword") String keyword,
            @Param("status") String status,
            Pageable pageable
    );

    // Admin được xem chi tiết cả Recipe DELETED.
    @Query("""
            SELECT r
            FROM Recipe r
            LEFT JOIN FETCH r.category
            LEFT JOIN FETCH r.createdBy
            WHERE r.recipeId = :recipeId
            """)
    Optional<Recipe> findAdminDetailById(
            @Param("recipeId") Integer recipeId
    );
}