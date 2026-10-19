package com.chaybook.backend.shop.context;

import com.chaybook.backend.mealplan.dto.MealPlanItemResponse;
import com.chaybook.backend.mealplan.dto.MealPlanResponse;
import com.chaybook.backend.mealplan.service.MealPlanService;
import com.chaybook.backend.recipe.entity.Recipe;
import com.chaybook.backend.recipe.repository.RecipeRepository;
import com.chaybook.backend.shop.dto.RecommendationSource;
import com.chaybook.backend.shop.dto.ShopRecommendationRequest;
import com.chaybook.backend.shop.model.RecommendationContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@Component
public class MealPlanContextResolver implements RecommendationContextResolver {
    private final MealPlanService mealPlanService;
    private final RecipeRepository recipeRepository;

    public MealPlanContextResolver(MealPlanService mealPlanService, RecipeRepository recipeRepository) {
        this.mealPlanService = mealPlanService;
        this.recipeRepository = recipeRepository;
    }

    @Override
    public RecommendationSource supportedSource() {
        return RecommendationSource.MEAL_PLAN;
    }

    @Override
    @Transactional(readOnly = true)
    public RecommendationContext resolve(Integer userId, ShopRecommendationRequest request) {
        // The existing service enforces ownership and returns 404 for another user's plan.
        MealPlanResponse plan = mealPlanService.getPlan(userId, request.mealPlanId());
        if (!"ACTIVE".equals(plan.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Thực đơn không còn hoạt động.");
        }
        if (plan.getDurationDays() == null
                || request.dayNumber() < 1
                || request.dayNumber() > plan.getDurationDays()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày đã chọn nằm ngoài thực đơn.");
        }

        List<MealPlanItemResponse> matches = plan.getItems() == null ? List.of() : plan.getItems().stream()
                .filter(Objects::nonNull)
                .filter(item -> request.dayNumber().equals(item.getDayNumber()))
                .filter(item -> request.mealType().name().equals(item.getMealType()))
                .toList();
        if (matches.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bữa ăn đã chọn.");
        }
        if (matches.size() != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Có nhiều bữa ăn trùng ngày và loại bữa.");
        }

        MealPlanItemResponse item = matches.getFirst();
        if (item.getRecipe() == null || item.getRecipe().getRecipeId() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bữa ăn không có công thức hợp lệ.");
        }
        Recipe recipe = recipeRepository.findDetailById(item.getRecipe().getRecipeId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Công thức của bữa ăn không còn hoạt động."
                ));
        return new RecommendationContext(recipe.getName(), recipe.getRecipeId());
    }
}
