package com.chaybook.backend.category.service;

public record CategoryResponse(
        Integer categoryId,
        String name,
        String type,
        String description
) {
}