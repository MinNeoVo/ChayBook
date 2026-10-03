package com.chaybook.backend.mealplan.repository;

import com.chaybook.backend.mealplan.entity.MealPlanItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MealPlanItemRepository extends JpaRepository<MealPlanItem, Integer> {
    boolean existsByRecipe_RecipeId(Integer recipeId);

    List<MealPlanItem> findByMealPlanMealPlanIdOrderByDayNumberAscMealItemIdAsc(Integer mealPlanId);
}
