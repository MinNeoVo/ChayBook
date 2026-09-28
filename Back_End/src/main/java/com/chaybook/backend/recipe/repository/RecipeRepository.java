package com.chaybook.backend.recipe.repository;

import com.chaybook.backend.recipe.entity.Recipe;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecipeRepository extends JpaRepository<Recipe, Integer> {
    @Query("""
            SELECT r
            FROM Recipe r
            LEFT JOIN FETCH r.category c
            WHERE (:categoryId IS NULL OR c.categoryId = :categoryId)
              AND (
                  :keyword IS NULL
                  OR LOCATE(LOWER(:keyword), LOWER(r.name)) > 0
              )
            ORDER BY r.recipeId ASC
            """)
    List<Recipe> searchRecipes(
            @Param("categoryId") Integer categoryId,
            @Param("keyword") String keyword
    );

    @Query("""
            SELECT r
            FROM Recipe r
            LEFT JOIN FETCH r.category
            WHERE r.recipeId = :recipeId
            """)
    Optional<Recipe> findDetailById(
            @Param("recipeId") Integer recipeId
    );


    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT r
        FROM Recipe r
        WHERE r.recipeId = :recipeId
        """)
    Optional<Recipe> findByIdForUpdate(
            @Param("recipeId") Integer recipeId
    );
}
