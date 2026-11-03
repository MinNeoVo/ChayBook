package com.chaybook.backend.recognition.repository;

import com.chaybook.backend.recipe.entity.RecipeIngredient;
import com.chaybook.backend.recipe.entity.RecipeIngredientId;
import com.chaybook.backend.recognition.dto.RecipeSuggestionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecognitionRecipeRepository
        extends JpaRepository<RecipeIngredient, RecipeIngredientId> {

    @Query("""
            SELECT new com.chaybook.backend.recognition.dto.RecipeSuggestionResponse(
                r.recipeId,
                r.name,
                r.description,
                r.imageUrl,
                r.prepTime,
                r.cookTime,
                COUNT(DISTINCT i.ingredientId)
            )
            FROM RecipeIngredient ri
            JOIN ri.recipe r
            JOIN ri.ingredient i
            WHERE i.ingredientId IN :ingredientIds
              AND r.status = :activeStatus
            GROUP BY
                r.recipeId,
                r.name,
                r.description,
                r.imageUrl,
                r.prepTime,
                r.cookTime
            ORDER BY
                COUNT(DISTINCT i.ingredientId) DESC,
                r.recipeId DESC
            """)
    List<RecipeSuggestionResponse> findSuggestions(
            @Param("ingredientIds") List<Integer> ingredientIds,
            @Param("activeStatus") String activeStatus
    );
}