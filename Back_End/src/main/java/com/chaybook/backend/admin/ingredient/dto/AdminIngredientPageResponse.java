package com.chaybook.backend.admin.ingredient.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public record AdminIngredientPageResponse(
        List<AdminIngredientResponse> content,
        int number,
        int size,
        long totalElements,
        int totalPages
) {
    public static AdminIngredientPageResponse from(
            Page<AdminIngredientResponse> page
    ) {
        return new AdminIngredientPageResponse(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}