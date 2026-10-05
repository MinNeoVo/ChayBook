package com.chaybook.backend.mealplan.service;

import com.chaybook.backend.bmi.entity.BmiRecord;
import com.chaybook.backend.bmi.repository.BmiRecordRepository;
import com.chaybook.backend.mealplan.dto.MealPlanCreateRequest;
import com.chaybook.backend.mealplan.dto.MealPlanResponse;
import com.chaybook.backend.mealplan.entity.MealPlan;
import com.chaybook.backend.mealplan.repository.MealPlanItemRepository;
import com.chaybook.backend.mealplan.repository.MealPlanRepository;
import com.chaybook.backend.recipe.entity.Recipe;
import com.chaybook.backend.recipe.repository.RecipeIngredientRepository;
import com.chaybook.backend.recipe.repository.RecipeRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import com.chaybook.backend.allergy.entity.Allergy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MealPlanServiceTest {
    private static final Integer USER_ID = 27;
    private static final Integer ALLERGY_ID = 4;

    @Mock private MealPlanRepository mealPlanRepository;
    @Mock private MealPlanItemRepository mealPlanItemRepository;
    @Mock private BmiRecordRepository bmiRecordRepository;
    @Mock private RecipeRepository recipeRepository;
    @Mock private RecipeIngredientRepository recipeIngredientRepository;
    @Mock private UserRepository userRepository;
    @Mock private User user;
    @Mock private BmiRecord bmiRecord;
    @Mock private Allergy allergy;

    private MealPlanService service;

    @BeforeEach
    void setUp() {
        service = new MealPlanService(
                mealPlanRepository,
                mealPlanItemRepository,
                bmiRecordRepository,
                recipeRepository,
                recipeIngredientRepository,
                userRepository
        );
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
    }

    @Test
    void generateFiltersAllergyRecipesPersistsBmiAndReturnsThreeMealsPerDay() {
        Recipe blocked = recipe(1, 280);
        Recipe safe = recipe(2, 320);
        when(user.getUserId()).thenReturn(USER_ID);
        when(user.getAllergies()).thenReturn(Set.of(allergy));
        when(allergy.getAllergyId()).thenReturn(ALLERGY_ID);
        when(bmiRecordRepository.findFirstByUserUserIdOrderByCalculatedAtDesc(USER_ID))
                .thenReturn(Optional.of(bmiRecord));
        when(bmiRecord.getCategory()).thenReturn("NORMAL");
        when(bmiRecord.getUser()).thenReturn(user);
        when(safe.getProtein()).thenReturn(16.0);
        when(safe.getName()).thenReturn("Recipe 2");
        when(mealPlanRepository.save(any(MealPlan.class))).thenAnswer(invocation -> {
            MealPlan plan = invocation.getArgument(0);
            setField(plan, "mealPlanId", 91);
            return plan;
        });
        when(recipeIngredientRepository.findRecipeIdsContainingAllergies(List.of(ALLERGY_ID)))
                .thenReturn(List.of(1));
        when(recipeRepository.findAll()).thenReturn(List.of(blocked, safe));

        MealPlanResponse response = service.generate(USER_ID, request(3));

        assertEquals(91, response.getMealPlanId());
        assertEquals(3, response.getDurationDays());
        assertEquals(9, response.getItems().size());
        assertTrue(response.getItems().stream().allMatch(item -> item.getRecipe().getRecipeId().equals(2)));
        assertEquals(bmiRecord.getBmi(), response.getBmi().getBmi());

        ArgumentCaptor<MealPlan> planCaptor = ArgumentCaptor.forClass(MealPlan.class);
        verify(mealPlanRepository).save(planCaptor.capture());
        assertEquals(bmiRecord, planCaptor.getValue().getBmiRecord());
        assertEquals(USER_ID, planCaptor.getValue().getUser().getUserId());
        verify(mealPlanItemRepository).saveAll(any());
    }

    @Test
    void generateRequiresASavedBmi() {
        when(bmiRecordRepository.findFirstByUserUserIdOrderByCalculatedAtDesc(USER_ID))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.generate(USER_ID, request(3))
        );

        assertEquals(409, exception.getStatusCode().value());
        verify(mealPlanRepository, never()).save(any(MealPlan.class));
    }

    @Test
    void generateRejectsWhenAllRecipesMatchSavedAllergies() {
        Recipe recipe = recipe(1, 280);
        when(user.getAllergies()).thenReturn(Set.of(allergy));
        when(allergy.getAllergyId()).thenReturn(ALLERGY_ID);
        when(bmiRecordRepository.findFirstByUserUserIdOrderByCalculatedAtDesc(USER_ID))
                .thenReturn(Optional.of(bmiRecord));
        when(recipeIngredientRepository.findRecipeIdsContainingAllergies(List.of(ALLERGY_ID)))
                .thenReturn(List.of(1));
        when(recipeRepository.findAll()).thenReturn(List.of(recipe));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.generate(USER_ID, request(3))
        );

        assertEquals(422, exception.getStatusCode().value());
        verify(mealPlanRepository, never()).save(any(MealPlan.class));
    }

    private MealPlanCreateRequest request(int days) {
        MealPlanCreateRequest request = new MealPlanCreateRequest();
        request.setHealthGoal("MAINTAIN");
        request.setDurationDays(days);
        return request;
    }

    private Recipe recipe(int id, double calories) {
        Recipe recipe = org.mockito.Mockito.mock(Recipe.class);
        when(recipe.getRecipeId()).thenReturn(id);
        when(recipe.getCalories()).thenReturn(calories);
        return recipe;
    }

    private static void setField(Object target, String name, Object value) {
        try {
            Field field = target.getClass().getDeclaredField(name);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException exception) {
            throw new AssertionError("Could not initialize test fixture", exception);
        }
    }
}
