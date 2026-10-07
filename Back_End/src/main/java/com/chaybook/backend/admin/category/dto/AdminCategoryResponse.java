package com.chaybook.backend.admin.category.dto;

public record AdminCategoryResponse(
        Integer categoryId,
        String name,
        String type,
        String description
) {
}