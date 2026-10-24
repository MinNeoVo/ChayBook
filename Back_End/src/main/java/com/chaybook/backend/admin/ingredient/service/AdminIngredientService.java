package com.chaybook.backend.admin.ingredient.service;

import com.chaybook.backend.admin.ingredient.dto.AdminIngredientRequest;
import com.chaybook.backend.ingredient.dto.IngredientResponse;
import org.springframework.data.domain.Page;

public interface AdminIngredientService {

    Page<IngredientResponse> getIngredients(
            Integer authenticatedUserId,
            String q,
            int page,
            int size
    );

    IngredientResponse getIngredientDetail(
            Integer authenticatedUserId,
            Integer ingredientId
    );

    IngredientResponse createIngredient(
            Integer authenticatedUserId,
            AdminIngredientRequest request
    );

    IngredientResponse updateIngredient(
            Integer authenticatedUserId,
            Integer ingredientId,
            AdminIngredientRequest request
    );

    void deleteIngredient(
            Integer authenticatedUserId,
            Integer ingredientId
    );
}