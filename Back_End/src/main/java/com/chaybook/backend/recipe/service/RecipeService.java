package com.chaybook.backend.recipe.service;

import com.chaybook.backend.category.entity.Category;
import com.chaybook.backend.category.repository.CategoryRepository;
import com.chaybook.backend.ingredient.entity.Ingredient;
import com.chaybook.backend.ingredient.repository.IngredientRepository;
import com.chaybook.backend.mealplan.repository.MealPlanItemRepository;
import com.chaybook.backend.recipe.dto.*;
import com.chaybook.backend.recipe.entity.*;
import com.chaybook.backend.recipe.exception.RecipeException;
import com.chaybook.backend.recipe.repository.*;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class RecipeService {
    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final CategoryRepository categoryRepository;
    private final IngredientRepository ingredientRepository;
    private final UserRepository userRepository;
    private final MealPlanItemRepository mealPlanItemRepository;

    public RecipeService(
            RecipeRepository recipeRepository,
            RecipeIngredientRepository recipeIngredientRepository,
            CategoryRepository categoryRepository,
            IngredientRepository ingredientRepository,
            UserRepository userRepository,
            MealPlanItemRepository mealPlanItemRepository
    ) {

        this.recipeRepository = recipeRepository;
        this.recipeIngredientRepository = recipeIngredientRepository;
        this.categoryRepository = categoryRepository;
        this.ingredientRepository = ingredientRepository;
        this.userRepository = userRepository;
        this.mealPlanItemRepository = mealPlanItemRepository;
    }

    public List<RecipeSummaryResponse> getRecipes(
            Integer categoryId,
            String keyword
    ) {
        if (categoryId != null && categoryId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Category ID must be greater than 0"
            );
        }

        String normalizedKeyword = normalizeKeyword(keyword);

        return recipeRepository.searchRecipes(
                        categoryId,
                        normalizedKeyword
                )
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    public RecipeDetailResponse getRecipeDetail(Integer recipeId) {
        if (recipeId == null || recipeId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Recipe ID must be greater than 0"
            );
        }

        Recipe recipe = recipeRepository.findDetailById(recipeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Recipe not found"
                ));

        List<RecipeIngredientResponse> ingredients =
                recipeIngredientRepository
                        .findIngredientsByRecipeId(recipeId)
                        .stream()
                        .map(this::toIngredientResponse)
                        .toList();

        return new RecipeDetailResponse(
                recipe.getRecipeId(),
                getCategoryId(recipe),
                getCategoryName(recipe),
                recipe.getName(),
                recipe.getDescription(),
                recipe.getImageUrl(),
                recipe.getPrepTime(),
                recipe.getCookTime(),
                recipe.getServings(),
                recipe.getDifficulty(),
                recipe.getInstructions(),
                recipe.getCalories(),
                recipe.getProtein(),
                recipe.getCarbs(),
                recipe.getFat(),
                ingredients
        );
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }

        return keyword.strip();
    }

    private Integer getCategoryId(Recipe recipe) {
        return recipe.getCategory() == null
                ? null
                : recipe.getCategory().getCategoryId();
    }

    private String getCategoryName(Recipe recipe) {
        return recipe.getCategory() == null
                ? null
                : recipe.getCategory().getName();
    }

    private RecipeSummaryResponse toSummaryResponse(Recipe recipe) {
        return new RecipeSummaryResponse(
                recipe.getRecipeId(),
                getCategoryId(recipe),
                recipe.getName(),
                recipe.getDescription(),
                recipe.getImageUrl(),
                recipe.getPrepTime(),
                recipe.getCookTime()
        );
    }

    private RecipeIngredientResponse toIngredientResponse(
            RecipeIngredient recipeIngredient
    ) {
        Ingredient ingredient = recipeIngredient.getIngredient();

        return new RecipeIngredientResponse(
                ingredient.getIngredientId(),
                ingredient.getName(),
                recipeIngredient.getQuantity(),
                recipeIngredient.getUnit()
        );
    }

    @Transactional
    public RecipeCreateResponse createRecipe(
            Integer authenticatedUserId,
            RecipeWriteRequest request
    ) {
        User currentUser = requireAdmin(authenticatedUserId);
        Category category = requireCategory(request.categoryId());

        Map<Integer, Ingredient> ingredientsById =
                validateAndLoadIngredients(request.ingredients());

        Recipe recipe = new Recipe();
        applyRecipeFields(recipe, category, request);

        recipe.setCreatedBy(currentUser);

        Recipe savedRecipe = recipeRepository.saveAndFlush(recipe);

        List<RecipeIngredient> savedIngredients = syncIngredients(
                savedRecipe,
                request.ingredients(),
                ingredientsById
        );

        return new RecipeCreateResponse(
                savedRecipe.getRecipeId(),
                savedRecipe.getCategory().getCategoryId(),
                currentUser.getUserId(),
                savedRecipe.getName(),
                savedRecipe.getDescription(),
                savedRecipe.getImageUrl(),
                savedRecipe.getPrepTime(),
                savedRecipe.getCookTime(),
                savedRecipe.getInstructions(),
                savedIngredients.stream()
                        .map(this::toIngredientResponse)
                        .toList()
        );
    }

    @Transactional
    public RecipeUpdateResponse updateRecipe(
            Integer recipeId,
            Integer authenticatedUserId,
            RecipeWriteRequest request
    ) {
        requireAdmin(authenticatedUserId);
        Recipe recipe = requireRecipeForUpdate(recipeId);
        Category category = requireCategory(request.categoryId());

        Map<Integer, Ingredient> ingredientsById =
                validateAndLoadIngredients(request.ingredients());

        applyRecipeFields(recipe, category, request);

        recipeRepository.save(recipe);

        syncIngredients(
                recipe,
                request.ingredients(),
                ingredientsById
        );

        return new RecipeUpdateResponse(
                recipe.getRecipeId(),
                "Recipe updated successfully"
        );
    }

    @Transactional
    public RecipeDeleteResponse deleteRecipe(
            Integer recipeId,
            Integer authenticatedUserId
    ) {
        requireAdmin(authenticatedUserId);

        Recipe recipe = requireRecipeForUpdate(recipeId);


        if (mealPlanItemRepository.existsByRecipe_RecipeId(recipeId)) {
            throw new RecipeException(
                    HttpStatus.CONFLICT,
                    "Cannot delete a recipe that is used in a meal plan"
            );
        }

        List<RecipeIngredient> recipeIngredients =
                recipeIngredientRepository
                        .findIngredientsByRecipeId(recipeId);

        recipeIngredientRepository.deleteAll(recipeIngredients);
        recipeIngredientRepository.flush();

        recipeRepository.delete(recipe);
        recipeRepository.flush();

        return new RecipeDeleteResponse(
                "Recipe deleted successfully"
        );
    }

    private User requireAdmin(Integer authenticatedUserId) {
        if (authenticatedUserId == null) {
            throw new RecipeException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        User user = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new RecipeException(
                        HttpStatus.UNAUTHORIZED,
                        "Please log in again"
                ));

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new RecipeException(
                    HttpStatus.FORBIDDEN,
                    "Your account is not active"
            );
        }

        if (!"ADMIN".equals(user.getRole())) {
            throw new RecipeException(
                    HttpStatus.FORBIDDEN,
                    "Only admins can manage recipes"
            );
        }

        return user;
    }



    private Category requireCategory(Integer categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RecipeException(
                        HttpStatus.NOT_FOUND,
                        "Category not found"
                ));
    }

    private Recipe requireRecipeForUpdate(Integer recipeId) {
        if (recipeId == null || recipeId <= 0) {
            throw new RecipeException(
                    HttpStatus.BAD_REQUEST,
                    "Recipe ID must be greater than 0"
            );
        }

        return recipeRepository.findByIdForUpdate(recipeId)
                .orElseThrow(() -> new RecipeException(
                        HttpStatus.NOT_FOUND,
                        "Recipe not found"
                ));
    }

    private Map<Integer, Ingredient> validateAndLoadIngredients(
            List<RecipeIngredientRequest> requests
    ) {
        Set<Integer> ingredientIds = new HashSet<>();

        for (RecipeIngredientRequest item : requests) {
            if (!ingredientIds.add(item.ingredientId())) {
                throw new RecipeException(
                        HttpStatus.BAD_REQUEST,
                        "Duplicate ingredient ID: " + item.ingredientId()
                );
            }

            if (!Double.isFinite(item.quantity())) {
                throw new RecipeException(
                        HttpStatus.BAD_REQUEST,
                        "Ingredient quantity must be a finite number"
                );
            }
        }

        Map<Integer, Ingredient> ingredientsById = new HashMap<>();

        for (Ingredient ingredient :
                ingredientRepository.findAllById(ingredientIds)) {
            ingredientsById.put(
                    ingredient.getIngredientId(),
                    ingredient
            );
        }

        for (Integer ingredientId : ingredientIds) {
            if (!ingredientsById.containsKey(ingredientId)) {
                throw new RecipeException(
                        HttpStatus.NOT_FOUND,
                        "Ingredient not found: " + ingredientId
                );
            }
        }

        return ingredientsById;
    }

    private void applyRecipeFields(
            Recipe recipe,
            Category category,
            RecipeWriteRequest request
    ) {
        recipe.setCategory(category);
        recipe.setName(request.name().strip());
        recipe.setDescription(request.description());
        recipe.setImageUrl(request.imageUrl());
        recipe.setPrepTime(request.prepTime());
        recipe.setCookTime(request.cookTime());
        recipe.setInstructions(request.instructions());
    }

    private List<RecipeIngredient> syncIngredients(
            Recipe recipe,
            List<RecipeIngredientRequest> requests,
            Map<Integer, Ingredient> ingredientsById
    ) {
        List<RecipeIngredient> existingIngredients =
                recipeIngredientRepository.findIngredientsByRecipeId(
                        recipe.getRecipeId()
                );

        Map<Integer, RecipeIngredient> remaining = new HashMap<>();

        for (RecipeIngredient item : existingIngredients) {
            remaining.put(
                    item.getIngredient().getIngredientId(),
                    item
            );
        }

        List<RecipeIngredient> toSave = new ArrayList<>();

        for (RecipeIngredientRequest request : requests) {
            RecipeIngredient item = remaining.remove(
                    request.ingredientId()
            );

            if (item == null) {
                item = new RecipeIngredient();

                item.setId(new RecipeIngredientId(
                        recipe.getRecipeId(),
                        request.ingredientId()
                ));

                item.setRecipe(recipe);
                item.setIngredient(
                        ingredientsById.get(request.ingredientId())
                );
            }

            item.setQuantity(request.quantity());
            item.setUnit(request.unit().strip());

            toSave.add(item);
        }

        // Bỏ các liên kết không còn xuất hiện trong request.
        recipeIngredientRepository.deleteAll(remaining.values());

        return recipeIngredientRepository.saveAllAndFlush(toSave);
    }

}
