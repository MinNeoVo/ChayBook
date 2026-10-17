package com.chaybook.backend.shop.context;

import com.chaybook.backend.mealplan.dto.MealPlanItemResponse;
import com.chaybook.backend.mealplan.dto.MealPlanRecipeResponse;
import com.chaybook.backend.mealplan.dto.MealPlanResponse;
import com.chaybook.backend.mealplan.service.MealPlanService;
import com.chaybook.backend.recipe.entity.Recipe;
import com.chaybook.backend.recipe.repository.RecipeRepository;
import com.chaybook.backend.shop.dto.DietaryMode;
import com.chaybook.backend.shop.dto.MealType;
import com.chaybook.backend.shop.dto.RecommendationSource;
import com.chaybook.backend.shop.dto.ShopRecommendationRequest;
import com.chaybook.backend.shop.model.RecommendationContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationContextResolversTest {
    private static final int USER_ID = 27;
    private static final int PLAN_ID = 12;
    private static final int RECIPE_ID = 7;

    @Mock private RecipeRepository recipeRepository;
    @Mock private MealPlanService mealPlanService;
    @Mock private Recipe recipe;

    private MealPlanContextResolver mealPlanResolver;

    @BeforeEach
    void setUp() {
        mealPlanResolver = new MealPlanContextResolver(mealPlanService, recipeRepository);
    }

    @Test
    void searchNormalizesWhitespaceAndDoesNotInventARecipeId() {
        ShopRecommendationRequest request = request(RecommendationSource.SEARCH,
                "  Lau   nam\tchay  ", null, null, null, null);

        RecommendationContext context = new SearchContextResolver().resolve(USER_ID, request);

        assertEquals("Lau nam chay", context.dishName());
        assertNull(context.recipeId());
    }

    @Test
    void recipeUsesTheCurrentActiveRecipeNameFromTheRepository() {
        when(recipeRepository.findDetailById(RECIPE_ID)).thenReturn(Optional.of(recipe));
        when(recipe.getName()).thenReturn("Lau nam chay");
        when(recipe.getRecipeId()).thenReturn(RECIPE_ID);

        RecommendationContext context = new RecipeContextResolver(recipeRepository)
                .resolve(USER_ID, request(RecommendationSource.RECIPE, null, RECIPE_ID, null, null, null));

        assertEquals(new RecommendationContext("Lau nam chay", RECIPE_ID), context);
        verify(recipeRepository).findDetailById(RECIPE_ID);
    }

    @Test
    void recipeNotVisibleToTheActiveOnlyQueryReturnsNotFound() {
        when(recipeRepository.findDetailById(RECIPE_ID)).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> new RecipeContextResolver(recipeRepository).resolve(USER_ID,
                        request(RecommendationSource.RECIPE, null, RECIPE_ID, null, null, null)));

        assertEquals(404, error.getStatusCode().value());
    }

    @Test
    void mealPlanDelegatesOwnershipCheckBeforeReadingAnyRecipe() {
        ResponseStatusException denied = new ResponseStatusException(HttpStatus.NOT_FOUND);
        when(mealPlanService.getPlan(USER_ID, PLAN_ID)).thenThrow(denied);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> mealPlanResolver.resolve(USER_ID, mealRequest()));

        assertSame(denied, error);
        verify(mealPlanService).getPlan(USER_ID, PLAN_ID);
        verifyNoInteractions(recipeRepository);
    }

    @Test
    void mealPlanReadsCurrentRecipeInsteadOfTrustingTheSavedMealName() {
        when(mealPlanService.getPlan(USER_ID, PLAN_ID)).thenReturn(plan(List.of(
                meal(1, "DINNER", 99), meal(2, "LUNCH", 100), meal(2, "DINNER", RECIPE_ID))));
        when(recipeRepository.findDetailById(RECIPE_ID)).thenReturn(Optional.of(recipe));
        when(recipe.getName()).thenReturn("Current recipe name");
        when(recipe.getRecipeId()).thenReturn(RECIPE_ID);

        RecommendationContext context = mealPlanResolver.resolve(USER_ID, mealRequest());

        assertEquals(new RecommendationContext("Current recipe name", RECIPE_ID), context);
        verify(recipeRepository).findDetailById(RECIPE_ID);
    }

    @Test
    void mealPlanRejectsAnAmbiguousMealRatherThanChoosingTheFirst() {
        when(mealPlanService.getPlan(USER_ID, PLAN_ID)).thenReturn(plan(List.of(
                meal(2, "DINNER", RECIPE_ID), meal(2, "DINNER", 8))));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> mealPlanResolver.resolve(USER_ID, mealRequest()));

        assertEquals(409, error.getStatusCode().value());
        verifyNoInteractions(recipeRepository);
    }

    @Test
    void mealPlanRejectsARecipeDeletedAfterPlanCreation() {
        when(mealPlanService.getPlan(USER_ID, PLAN_ID)).thenReturn(plan(List.of(meal(2, "DINNER", RECIPE_ID))));
        when(recipeRepository.findDetailById(RECIPE_ID)).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> mealPlanResolver.resolve(USER_ID, mealRequest()));

        assertEquals(404, error.getStatusCode().value());
    }

    @Test
    void mealPlanRejectsADayBeyondThisPlansDuration() {
        MealPlanResponse plan = plan(List.of());
        plan.setDurationDays(1);
        when(mealPlanService.getPlan(USER_ID, PLAN_ID)).thenReturn(plan);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> mealPlanResolver.resolve(USER_ID, mealRequest()));

        assertEquals(400, error.getStatusCode().value());
        verifyNoInteractions(recipeRepository);
    }

    private static ShopRecommendationRequest mealRequest() {
        return request(RecommendationSource.MEAL_PLAN, null, null, PLAN_ID, 2, MealType.DINNER);
    }

    private static ShopRecommendationRequest request(RecommendationSource source, String query,
            Integer recipeId, Integer planId, Integer day, MealType mealType) {
        return new ShopRecommendationRequest(source, query, recipeId, planId, day, mealType,
                BigDecimal.ZERO, BigDecimal.ZERO, 5000, DietaryMode.VEGETARIAN, 10);
    }

    private static MealPlanResponse plan(List<MealPlanItemResponse> meals) {
        MealPlanResponse plan = new MealPlanResponse();
        plan.setMealPlanId(PLAN_ID);
        plan.setStatus("ACTIVE");
        plan.setDurationDays(3);
        plan.setItems(meals);
        return plan;
    }

    private static MealPlanItemResponse meal(int day, String type, int recipeId) {
        MealPlanRecipeResponse recipe = new MealPlanRecipeResponse();
        recipe.setRecipeId(recipeId);
        recipe.setName("Saved name that must not override the current recipe");
        MealPlanItemResponse meal = new MealPlanItemResponse();
        meal.setDayNumber(day);
        meal.setMealType(type);
        meal.setRecipe(recipe);
        return meal;
    }
}
