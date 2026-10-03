package com.chaybook.backend.mealplan.repository;

import com.chaybook.backend.mealplan.entity.MealPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MealPlanRepository extends JpaRepository<MealPlan, Integer> {
    List<MealPlan> findByUserUserIdOrderByGeneratedAtDesc(Integer userId);

    Optional<MealPlan> findByMealPlanIdAndUserUserId(Integer mealPlanId, Integer userId);
}
