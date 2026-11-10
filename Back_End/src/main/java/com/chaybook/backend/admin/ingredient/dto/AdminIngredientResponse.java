package com.chaybook.backend.admin.ingredient.dto;

public record AdminIngredientResponse(
        Integer ingredientId,
        String name,
        String description,
        String status
) {
}