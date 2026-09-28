package com.chaybook.backend.recipe.repository;

import com.chaybook.backend.recipe.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, RecipeIngredientId> {
    @Query("""
            SELECT ri
            FROM RecipeIngredient ri
            JOIN FETCH ri.ingredient i
            WHERE ri.recipe.recipeId = :recipeId
            ORDER BY i.ingredientId ASC
            """)
    List<RecipeIngredient> findIngredientsByRecipeId(
            @Param("recipeId") Integer recipeId
    );
}
