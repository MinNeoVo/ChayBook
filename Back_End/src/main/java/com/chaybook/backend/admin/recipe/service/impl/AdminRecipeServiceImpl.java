package com.chaybook.backend.admin.recipe.service.impl;

import com.chaybook.backend.admin.recipe.dto.AdminRecipeResponse;
import com.chaybook.backend.admin.recipe.service.AdminRecipeService;
import com.chaybook.backend.category.entity.Category;
import com.chaybook.backend.category.enums.CategoryStatus;
import com.chaybook.backend.category.repository.CategoryRepository;
import com.chaybook.backend.common.pagination.PageResponse;
import com.chaybook.backend.ingredient.entity.Ingredient;
import com.chaybook.backend.ingredient.enums.IngredientStatus;
import com.chaybook.backend.ingredient.repository.IngredientRepository;
import com.chaybook.backend.recipe.dto.*;
import com.chaybook.backend.recipe.entity.*;
import com.chaybook.backend.recipe.enums.RecipeStatus;
import com.chaybook.backend.recipe.exception.RecipeException;
import com.chaybook.backend.recipe.repository.*;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.enums.UserStatus;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class AdminRecipeServiceImpl implements AdminRecipeService {

    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final CategoryRepository categoryRepository;
    private final IngredientRepository ingredientRepository;
    private final UserRepository userRepository;

    public AdminRecipeServiceImpl(
            RecipeRepository recipeRepository,
            RecipeIngredientRepository recipeIngredientRepository,
            CategoryRepository categoryRepository,
            IngredientRepository ingredientRepository,
            UserRepository userRepository
    ) {
        this.recipeRepository = recipeRepository;
        this.recipeIngredientRepository = recipeIngredientRepository;
        this.categoryRepository = categoryRepository;
        this.ingredientRepository = ingredientRepository;
        this.userRepository = userRepository;
    }


    public PageResponse<AdminRecipeResponse.Summary> getRecipes(
            Integer authenticatedUserId,
            Integer categoryId,
            String keyword,
            String status,
            int page,
            int size
    ) {
        requireAdmin(authenticatedUserId);

        if (page < 0 || size < 1 || size > 10
                || (long) page * size > Integer.MAX_VALUE) {
            throw new RecipeException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid pagination: page must be >= 0 and size from 1 to 10"
            );
        }

        if (categoryId != null && categoryId <= 0) {
            throw new RecipeException(
                    HttpStatus.BAD_REQUEST,
                    "Category ID must be greater than 0"
            );
        }

        String normalizedKeyword = keyword == null || keyword.isBlank()
                ? null
                : keyword.strip();

        String normalizedStatus = normalizeOptionalStatus(status);

        Page<Recipe> result = recipeRepository.searchForAdmin(
                categoryId,
                normalizedKeyword,
                normalizedStatus,
                PageRequest.of(page, size)
        );

        return PageResponse.from(result.map(this::toAdminSummary));
    }

    public AdminRecipeResponse getRecipeDetail(
            Integer authenticatedUserId,
            Integer recipeId
    ) {
        requireAdmin(authenticatedUserId);

        if (recipeId == null || recipeId <= 0) {
            throw new RecipeException(
                    HttpStatus.BAD_REQUEST,
                    "Recipe ID must be greater than 0"
            );
        }

        Recipe recipe = recipeRepository.findAdminDetailById(recipeId)
                .orElseThrow(() -> new RecipeException(
                        HttpStatus.NOT_FOUND,
                        "Recipe not found"
                ));

        List<RecipeIngredientResponse> ingredients =
                recipeIngredientRepository.findIngredientsByRecipeId(recipeId)
                        .stream()
                        .map(this::toIngredientResponse)
                        .toList();

        Category category = recipe.getCategory();

        return new AdminRecipeResponse(
                recipe.getRecipeId(),
                category == null ? null : category.getCategoryId(),
                category == null ? null : category.getName(),
                recipe.getCreatedBy() == null
                        ? null
                        : recipe.getCreatedBy().getUserId(),
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
                recipe.getStatus(),
                recipe.getCreatedAt(),
                recipe.getUpdatedAt(),
                ingredients
        );
    }

    private AdminRecipeResponse.Summary toAdminSummary(Recipe recipe) {
        Category category = recipe.getCategory();

        return new AdminRecipeResponse.Summary(
                recipe.getRecipeId(),
                category == null ? null : category.getCategoryId(),
                category == null ? null : category.getName(),
                recipe.getName(),
                recipe.getImageUrl(),
                recipe.getStatus()
        );
    }

    private String normalizeOptionalStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        String normalized = status.strip().toUpperCase(Locale.ROOT);

        try {
            return RecipeStatus.valueOf(normalized).name();
        } catch (IllegalArgumentException exception) {
            throw new RecipeException(
                    HttpStatus.BAD_REQUEST,
                    "Status must be ACTIVE or DELETED"
            );
        }
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
                savedRecipe.getServings(),
                savedRecipe.getDifficulty(),
                savedRecipe.getInstructions(),
                savedRecipe.getCalories(),
                savedRecipe.getProtein(),
                savedRecipe.getCarbs(),
                savedRecipe.getFat(),
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

        if (!RecipeStatus.ACTIVE.name().equals(recipe.getStatus())) {
            throw new RecipeException(
                    HttpStatus.CONFLICT,
                    "Cannot update a deleted recipe"
            );
        }

        Category currentCategory = recipe.getCategory();

        Category category =
                currentCategory != null
                        && Objects.equals(
                        currentCategory.getCategoryId(),
                        request.categoryId()
                )
                        ? currentCategory
                        : requireCategory(request.categoryId());

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

        if (!RecipeStatus.DELETED.name().equals(recipe.getStatus())) {
            recipe.setStatus(RecipeStatus.DELETED.name());
            recipeRepository.saveAndFlush(recipe);
        }

        return new RecipeDeleteResponse(
                "Recipe deleted successfully"
        );
    }

    private User requireAdmin(Integer authenticatedUserId) {
        if (authenticatedUserId == null || authenticatedUserId <= 0) {
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

        if (!UserStatus.ACTIVE.name().equals(user.getStatus())) {
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
        if (categoryId == null || categoryId <= 0) {
            throw new RecipeException(
                    HttpStatus.BAD_REQUEST,
                    "Category ID must be greater than 0"
            );
        }

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RecipeException(
                        HttpStatus.NOT_FOUND,
                        "Category not found"
                ));

        if (!CategoryStatus.ACTIVE.name().equals(category.getStatus())) {
            throw new RecipeException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot select a deleted category"
            );
        }

        if (!"RECIPE".equals(category.getType())) {
            throw new RecipeException(
                    HttpStatus.BAD_REQUEST,
                    "Category must have type RECIPE"
            );
        }

        return category;
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
        
        for (Integer ingredientId : ingredientIds.stream().sorted().toList()) {
        Ingredient ingredient = ingredientRepository
                .findByIdForUpdate(ingredientId)
                .orElseThrow(() -> new RecipeException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy nguyên liệu có mã " + ingredientId + "."
                ));

        if (!IngredientStatus.ACTIVE.name().equals(ingredient.getStatus())) {
                throw new RecipeException(
                        HttpStatus.CONFLICT,
                        "Nguyên liệu \"" + ingredient.getName()
                                + "\" đã bị xóa. Vui lòng chọn nguyên liệu khác."
                );
        }

        ingredientsById.put(ingredientId, ingredient);
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
        recipe.setServings(request.servings());
        recipe.setDifficulty(request.difficulty().strip());
        recipe.setInstructions(request.instructions());
        recipe.setCalories(request.calories());
        recipe.setProtein(request.protein());
        recipe.setCarbs(request.carbs());
        recipe.setFat(request.fat());
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

        recipeIngredientRepository.deleteAll(remaining.values());

        return recipeIngredientRepository.saveAllAndFlush(toSave);
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
}