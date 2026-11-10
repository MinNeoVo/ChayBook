package com.chaybook.backend.admin.recipe.service;

import com.chaybook.backend.admin.recipe.dto.AdminRecipeResponse;
import com.chaybook.backend.common.pagination.PageResponse;
import com.chaybook.backend.recipe.dto.RecipeCreateResponse;
import com.chaybook.backend.recipe.dto.RecipeDeleteResponse;
import com.chaybook.backend.recipe.dto.RecipeUpdateResponse;
import com.chaybook.backend.recipe.dto.RecipeWriteRequest;

public interface AdminRecipeService {

    PageResponse<AdminRecipeResponse.Summary> getRecipes(
            Integer authenticatedUserId,
            Integer categoryId,
            String keyword,
            String status,
            int page,
            int size
    );

    AdminRecipeResponse getRecipeDetail(
            Integer authenticatedUserId,
            Integer recipeId
    );

    RecipeCreateResponse createRecipe(
            Integer authenticatedUserId,
            RecipeWriteRequest request
    );

    RecipeUpdateResponse updateRecipe(
            Integer recipeId,
            Integer authenticatedUserId,
            RecipeWriteRequest request
    );

    RecipeDeleteResponse deleteRecipe(
            Integer recipeId,
            Integer authenticatedUserId
    );
}