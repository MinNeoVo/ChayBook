package com.chaybook.backend.mealplan.service;

import com.chaybook.backend.bmi.dto.BmiResponse;
import com.chaybook.backend.bmi.entity.BmiRecord;
import com.chaybook.backend.bmi.repository.BmiRecordRepository;
import com.chaybook.backend.mealplan.dto.MealPlanCreateRequest;
import com.chaybook.backend.mealplan.dto.MealPlanItemResponse;
import com.chaybook.backend.mealplan.dto.MealPlanRecipeResponse;
import com.chaybook.backend.mealplan.dto.MealPlanResponse;
import com.chaybook.backend.mealplan.entity.MealPlan;
import com.chaybook.backend.mealplan.entity.MealPlanItem;
import com.chaybook.backend.mealplan.repository.MealPlanItemRepository;
import com.chaybook.backend.mealplan.repository.MealPlanRepository;
import com.chaybook.backend.recipe.entity.Recipe;
import com.chaybook.backend.recipe.repository.RecipeIngredientRepository;
import com.chaybook.backend.recipe.repository.RecipeRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class MealPlanService {
    private static final Logger log = LoggerFactory.getLogger(MealPlanService.class);
    private static final List<String> MEAL_TYPES = List.of("BREAKFAST", "LUNCH", "DINNER");

    private final MealPlanRepository mealPlanRepository;
    private final MealPlanItemRepository mealPlanItemRepository;
    private final BmiRecordRepository bmiRecordRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final UserRepository userRepository;

    public MealPlanService(
            MealPlanRepository mealPlanRepository,
            MealPlanItemRepository mealPlanItemRepository,
            BmiRecordRepository bmiRecordRepository,
            RecipeRepository recipeRepository,
            RecipeIngredientRepository recipeIngredientRepository,
            UserRepository userRepository
    ) {
        this.mealPlanRepository = mealPlanRepository;
        this.mealPlanItemRepository = mealPlanItemRepository;
        this.bmiRecordRepository = bmiRecordRepository;
        this.recipeRepository = recipeRepository;
        this.recipeIngredientRepository = recipeIngredientRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public MealPlanResponse generate(Integer userId, MealPlanCreateRequest request) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            BmiRecord bmi = bmiRecordRepository.findFirstByUserUserIdOrderByCalculatedAtDesc(userId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Calculate and save your BMI before generating a meal plan"
                    ));

            String healthGoal = normalizeGoal(request.getHealthGoal());
            Integer durationDays = request.getDurationDays();
            if (durationDays == null || durationDays < 1 || durationDays > 14) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duration must be between 1 and 14 days");
            }

            List<Integer> allergyIds = user.getAllergies().stream()
                    .map(allergy -> allergy.getAllergyId())
                    .toList();
            Set<Integer> excludedRecipeIds = allergyIds.isEmpty()
                    ? Set.of()
                    : new HashSet<>(recipeIngredientRepository.findRecipeIdsContainingAllergies(allergyIds));

            List<Recipe> eligibleRecipes =
                    recipeRepository.findByStatus("ACTIVE").stream()
                    .filter(recipe -> recipe.getCalories() != null && recipe.getCalories() > 0)
                    .filter(recipe -> !excludedRecipeIds.contains(recipe.getRecipeId()))
                    .toList();
            if (eligibleRecipes.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.UNPROCESSABLE_ENTITY,
                        "No recipes with nutrition data are available after filtering your saved allergies"
                );
            }

            MealPlan plan = new MealPlan(user, bmi, healthGoal, durationDays, null, null, "ACTIVE");
            MealPlan savedPlan = mealPlanRepository.save(plan);
            List<MealPlanItem> items = new ArrayList<>(durationDays * MEAL_TYPES.size());
            Integer lastRecipeId = null;

            for (int day = 1; day <= durationDays; day++) {
                Set<Integer> recipesUsedToday = new HashSet<>();
                for (String mealType : MEAL_TYPES) {
                    Recipe recipe = chooseRecipe(
                            eligibleRecipes,
                            bmi.getCategory(),
                            healthGoal,
                            lastRecipeId,
                            recipesUsedToday
                    );
                    items.add(new MealPlanItem(savedPlan, recipe, day, mealType));
                    recipesUsedToday.add(recipe.getRecipeId());
                    lastRecipeId = recipe.getRecipeId();
                }
            }

            mealPlanItemRepository.saveAll(items);
            return toResponse(savedPlan, items);
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.error("Failed to generate meal plan for userId={}", userId, exception);
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public List<MealPlanResponse> getPlans(Integer userId) {
        try {
            return mealPlanRepository.findByUserUserIdOrderByGeneratedAtDesc(userId).stream()
                    .map(this::toResponse)
                    .toList();
        } catch (RuntimeException exception) {
            log.error("Failed to load meal plans for userId={}", userId, exception);
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public MealPlanResponse getPlan(Integer userId, Integer mealPlanId) {
        try {
            MealPlan plan = mealPlanRepository.findByMealPlanIdAndUserUserId(mealPlanId, userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meal plan not found"));
            return toResponse(plan);
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.error("Failed to load mealPlanId={} for userId={}", mealPlanId, userId, exception);
            throw exception;
        }
    }

    private String normalizeGoal(String goal) {
        if (goal == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a health goal");
        }
        String normalized = goal.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("WEIGHT_LOSS", "MAINTAIN", "WEIGHT_GAIN").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported health goal");
        }
        return normalized;
    }

    private Recipe chooseRecipe(
            List<Recipe> recipes,
            String bmiCategory,
            String healthGoal,
            Integer lastRecipeId,
            Set<Integer> recipesUsedToday
    ) {
        double averageCalories = recipes.stream().mapToDouble(Recipe::getCalories).average().orElseThrow();
        double averageProteinDensity = recipes.stream()
                .filter(recipe -> recipe.getProtein() != null)
                .mapToDouble(recipe -> recipe.getProtein() / recipe.getCalories())
                .average().orElse(0);

        double goalFactor = switch (healthGoal) {
            case "WEIGHT_LOSS" -> 0.88;
            case "WEIGHT_GAIN" -> 1.12;
            default -> 1.0;
        };
        double bmiFactor = switch (bmiCategory == null ? "" : bmiCategory.toUpperCase(Locale.ROOT)) {
            case "UNDERWEIGHT" -> 1.05;
            case "OVERWEIGHT", "OBESE" -> 0.95;
            default -> 1.0;
        };
        double calorieTarget = averageCalories * goalFactor * bmiFactor;

        List<Recipe> choices = recipes.stream()
                .filter(recipe -> !recipesUsedToday.contains(recipe.getRecipeId()))
                .toList();
        if (choices.isEmpty()) {
            choices = recipes;
        }
        List<Recipe> distinctFromPrevious = choices.stream()
                .filter(recipe -> !recipe.getRecipeId().equals(lastRecipeId))
                .toList();
        if (!distinctFromPrevious.isEmpty()) {
            choices = distinctFromPrevious;
        }

        final double target = calorieTarget;
        final double proteinDensity = averageProteinDensity;
        List<Recipe> ranked = choices.stream()
                .sorted(Comparator.comparingDouble(recipe -> nutritionScore(
                        recipe, target, proteinDensity, healthGoal
                )))
                .toList();
        int shortlistSize = Math.min(3, ranked.size());
        return ranked.get(ThreadLocalRandom.current().nextInt(shortlistSize));
    }

    private double nutritionScore(Recipe recipe, double calorieTarget, double averageProteinDensity, String healthGoal) {
        double calorieScore = Math.abs(Math.log(recipe.getCalories() / calorieTarget));
        if (recipe.getProtein() == null || averageProteinDensity == 0) {
            return calorieScore + 0.15;
        }
        double proteinDensity = recipe.getProtein() / recipe.getCalories();
        double proteinBonus = switch (healthGoal) {
            case "WEIGHT_LOSS", "WEIGHT_GAIN" ->
                    Math.min(0.2, Math.max(-0.2, (proteinDensity / averageProteinDensity - 1) * 0.2));
            default -> 0;
        };
        return calorieScore - proteinBonus;
    }

    private MealPlanResponse toResponse(MealPlan plan) {
        List<MealPlanItem> items = mealPlanItemRepository
                .findByMealPlanMealPlanIdOrderByDayNumberAscMealItemIdAsc(plan.getMealPlanId());
        return toResponse(plan, items);
    }

    private MealPlanResponse toResponse(MealPlan plan, List<MealPlanItem> items) {
        MealPlanResponse response = new MealPlanResponse();
        response.setMealPlanId(plan.getMealPlanId());
        response.setBmi(toBmiResponse(plan.getBmiRecord()));
        response.setHealthGoal(plan.getHealthGoal());
        response.setDurationDays(plan.getDurationDays());
        response.setDietaryPreference(plan.getDietaryPreference());
        response.setStatus(plan.getStatus());
        response.setGeneratedAt(plan.getGeneratedAt());
        response.setItems(items.stream().map(this::toItemResponse).toList());
        return response;
    }

    private BmiResponse toBmiResponse(BmiRecord record) {
        if (record == null) {
            return null;
        }
        BmiResponse response = new BmiResponse();
        response.setBmiRecordId(record.getBmiId());
        response.setUserId(record.getUser().getUserId());
        response.setHeight(record.getHeight());
        response.setWeight(record.getWeight());
        response.setBmi(record.getBmi());
        response.setCategory(record.getCategory());
        response.setCreatedAt(record.getCalculatedAt());
        return response;
    }

    private MealPlanItemResponse toItemResponse(MealPlanItem item) {
        Recipe recipe = item.getRecipe();
        MealPlanRecipeResponse recipeResponse = new MealPlanRecipeResponse();
        recipeResponse.setRecipeId(recipe.getRecipeId());
        recipeResponse.setName(recipe.getName());
        recipeResponse.setDescription(recipe.getDescription());
        recipeResponse.setImageUrl(recipe.getImageUrl());
        recipeResponse.setPrepTime(recipe.getPrepTime());
        recipeResponse.setCookTime(recipe.getCookTime());
        recipeResponse.setCalories(recipe.getCalories());
        recipeResponse.setProtein(recipe.getProtein());
        recipeResponse.setCarbs(recipe.getCarbs());
        recipeResponse.setFat(recipe.getFat());

        MealPlanItemResponse response = new MealPlanItemResponse();
        response.setDayNumber(item.getDayNumber());
        response.setMealType(item.getMealType());
        response.setRecipe(recipeResponse);
        return response;
    }
}
