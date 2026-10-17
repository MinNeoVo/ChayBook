package com.chaybook.backend.shop.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ShopRecommendationRequestTest {
    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void openValidator() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void closeValidator() {
        factory.close();
    }

    @Test
    void acceptsEachCompleteSourceAndInclusiveInputBounds() {
        assertTrue(validator.validate(request(RecommendationSource.SEARCH, "Pho chay", null,
                null, null, null, "-90", "-180", 500, 1)).isEmpty());
        assertTrue(validator.validate(request(RecommendationSource.RECIPE, null, 7,
                null, null, null, "90", "180", 10000, 10)).isEmpty());
        assertTrue(validator.validate(request(RecommendationSource.MEAL_PLAN, null, null,
                8, 14, MealType.DINNER, "10.77", "106.70", 5000, 10)).isEmpty());
    }

    @Test
    void rejectsBlankMissingAndMixedSourceContexts() {
        assertTrue(violations(request(RecommendationSource.SEARCH, " \t ", null,
                null, null, null, "0", "0", 500, 1)).contains("contextValid"));
        assertTrue(violations(request(RecommendationSource.SEARCH, "Pho chay", 7,
                null, null, null, "0", "0", 500, 1)).contains("contextValid"));
        assertTrue(violations(request(RecommendationSource.RECIPE, null, null,
                null, null, null, "0", "0", 500, 1)).contains("contextValid"));
        assertTrue(violations(request(RecommendationSource.MEAL_PLAN, null, null,
                8, 2, null, "0", "0", 500, 1)).contains("contextValid"));
    }

    @Test
    void requiresAllCommonFieldsWithoutAddingASpuriousContextViolation() {
        ShopRecommendationRequest empty = new ShopRecommendationRequest(
                null, null, null, null, null, null, null, null, null, null, null);

        assertEquals(Set.of("source", "latitude", "longitude", "radiusMeters", "dietaryMode", "limit"),
                violations(empty));
    }

    @Test
    void rejectsOutOfRangeCoordinatesRadiusLimitAndSourceIdentifiers() {
        assertEquals(Set.of("latitude", "longitude", "radiusMeters", "limit"),
                violations(request(RecommendationSource.SEARCH, "Pho chay", null,
                        null, null, null, "-90.001", "-180.001", 499, 0)));
        assertEquals(Set.of("latitude", "longitude", "radiusMeters", "limit"),
                violations(request(RecommendationSource.SEARCH, "Pho chay", null,
                        null, null, null, "90.001", "180.001", 10001, 11)));
        assertEquals(Set.of("recipeId"), violations(request(RecommendationSource.RECIPE, null, -1,
                null, null, null, "0", "0", 500, 1)));
        assertEquals(Set.of("mealPlanId", "dayNumber"),
                violations(request(RecommendationSource.MEAL_PLAN, null, null,
                        0, 15, MealType.LUNCH, "0", "0", 500, 1)));
        assertEquals(Set.of("query"), violations(request(RecommendationSource.SEARCH, "a".repeat(201), null,
                null, null, null, "0", "0", 500, 1)));
    }

    private static Set<String> violations(ShopRecommendationRequest request) {
        return validator.validate(request).stream()
                .map(violation -> violation.getPropertyPath().toString())
                .collect(Collectors.toSet());
    }

    private static ShopRecommendationRequest request(
            RecommendationSource source, String query, Integer recipeId,
            Integer mealPlanId, Integer dayNumber, MealType mealType,
            String latitude, String longitude, int radius, int limit) {
        return new ShopRecommendationRequest(source, query, recipeId, mealPlanId, dayNumber, mealType,
                new BigDecimal(latitude), new BigDecimal(longitude), radius, DietaryMode.VEGETARIAN, limit);
    }
}
