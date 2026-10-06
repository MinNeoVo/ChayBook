package com.chaybook.backend.admin.category.service;

public record AdminCategoryResponse(
        Integer categoryId,
        String name,
        String type,
        String description
) {
}