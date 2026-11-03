package com.chaybook.backend.ingredient.repository;

import com.chaybook.backend.ingredient.entity.Ingredient;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IngredientRepository
        extends JpaRepository<Ingredient, Integer> {

    List<Ingredient> findByStatus(String status, Sort sort);

    Optional<Ingredient> findByIngredientIdAndStatus(
            Integer ingredientId,
            String status
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

    Optional<Ingredient> findByNameIgnoreCaseAndStatus(
            String name,
            String status
    );
}