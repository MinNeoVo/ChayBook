package com.chaybook.backend.shop.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ShopRecommendationRequest(
        @NotNull RecommendationSource source,
        @Size(max = 200) String query,
        @Positive Integer recipeId,
        @Positive Integer mealPlanId,
        @Min(1) @Max(14) Integer dayNumber,
        MealType mealType,
        @NotNull @DecimalMin("-90") @DecimalMax("90") BigDecimal latitude,
        @NotNull @DecimalMin("-180") @DecimalMax("180") BigDecimal longitude,
        @NotNull @Min(500) @Max(10000) Integer radiusMeters,
        @NotNull DietaryMode dietaryMode,
        @NotNull @Min(1) @Max(10) Integer limit
) {
    @AssertTrue(message = "Các trường ngữ cảnh không phù hợp với source")
    public boolean isContextValid() {
        if (source == null) {
            return true;
        }

        return switch (source) {
            case SEARCH -> query != null
                    && !query.isBlank()
                    && recipeId == null
                    && mealPlanId == null
                    && dayNumber == null
                    && mealType == null;
            case RECIPE -> recipeId != null
                    && query == null
                    && mealPlanId == null
                    && dayNumber == null
                    && mealType == null;
            case MEAL_PLAN -> mealPlanId != null
                    && dayNumber != null
                    && mealType != null
                    && query == null
                    && recipeId == null;
        };
    }
}
