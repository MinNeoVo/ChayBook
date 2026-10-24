package com.chaybook.backend.admin.ingredient.repository;

import com.chaybook.backend.ingredient.entity.Ingredient;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AdminIngredientRepository
        extends JpaRepository<Ingredient, Integer> {

    @Query("""
        SELECT i
        FROM Ingredient i
        WHERE :keyword = ''
           OR LOCATE(LOWER(:keyword), LOWER(i.name)) > 0
        """)
    Page<Ingredient> search(
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("""
        SELECT COUNT(i)
        FROM Ingredient i
        WHERE i.name = :name
          AND (:excludedId IS NULL OR i.ingredientId <> :excludedId)
        """)
    long countDuplicates(
            @Param("name") String name,
            @Param("excludedId") Integer excludedId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT i
        FROM Ingredient i
        WHERE i.ingredientId = :ingredientId
        """)
    Optional<Ingredient> findByIdForUpdate(
            @Param("ingredientId") Integer ingredientId
    );

    @Query(value = """
        SELECT CASE WHEN
            EXISTS (
                SELECT 1
                FROM RECIPE_INGREDIENT
                WHERE ingredient_id = :ingredientId
            )
            OR EXISTS (
                SELECT 1
                FROM ALLERGY_INGREDIENT
                WHERE ingredient_id = :ingredientId
            )
            OR EXISTS (
                SELECT 1
                FROM AI_RECOGNITION_ITEM
                WHERE ingredient_id = :ingredientId
            )
        THEN 1 ELSE 0 END
        """, nativeQuery = true)
    int findUsageFlag(
            @Param("ingredientId") Integer ingredientId
    );
}