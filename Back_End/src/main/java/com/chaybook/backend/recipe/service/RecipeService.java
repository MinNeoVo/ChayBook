package com.chaybook.backend.recipe.service;


import com.chaybook.backend.category.repository.CategoryRepository;
import com.chaybook.backend.ingredient.entity.Ingredient;
import com.chaybook.backend.recipe.dto.*;
import com.chaybook.backend.recipe.entity.*;
import com.chaybook.backend.recipe.repository.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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


    public RecipeService(
            RecipeRepository recipeRepository,
            RecipeIngredientRepository recipeIngredientRepository,
            CategoryRepository categoryRepository

    ) {

        this.recipeRepository = recipeRepository;
        this.recipeIngredientRepository = recipeIngredientRepository;
        this.categoryRepository = categoryRepository;

    }

    public Page<RecipeSummaryResponse> getRecipes(
            Integer categoryId,
            String keyword,
            int page,
            int size
    ) {
        if (page < 0 || size < 1 || size > 10) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Page phải từ 0; size phải từ 1 đến 10"
                );
        }

        if (categoryId != null && categoryId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Category ID must be greater than 0"
            );
        }

        if (categoryId != null
                && !categoryRepository.existsByCategoryIdAndStatusAndType(
                categoryId,
                "ACTIVE",
                "RECIPE"
        )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Category must be ACTIVE and have type RECIPE"
            );
        }

        String normalizedKeyword = normalizeKeyword(keyword);

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "recipeId")
        );

        Page<Recipe> recipes;

        recipes = recipeRepository.searchRecipes(
                categoryId,
                normalizedKeyword,
                pageable
        );

        return recipes.map(this::toSummaryResponse);
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






}
