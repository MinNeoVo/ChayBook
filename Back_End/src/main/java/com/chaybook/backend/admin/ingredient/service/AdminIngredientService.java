package com.chaybook.backend.admin.ingredient.service;

import com.chaybook.backend.admin.ingredient.dto.AdminIngredientRequest;
import com.chaybook.backend.admin.ingredient.dto.AdminIngredientResponse;
import org.springframework.data.domain.Page;

public interface AdminIngredientService {

    Page<AdminIngredientResponse> getIngredients(
            Integer authenticatedUserId,
            String q,
            String status,
            int page,
            int size
    );

    AdminIngredientResponse getIngredientDetail(
            Integer authenticatedUserId,
            Integer ingredientId
    );

    AdminIngredientResponse createIngredient(
            Integer authenticatedUserId,
            AdminIngredientRequest request
    );

    AdminIngredientResponse updateIngredient(
            Integer authenticatedUserId,
            Integer ingredientId,
            AdminIngredientRequest request
    );

    void deleteIngredient(
            Integer authenticatedUserId,
            Integer ingredientId
    );

    AdminIngredientResponse restoreIngredient(
        Integer authenticatedUserId,
        Integer ingredientId
);
}