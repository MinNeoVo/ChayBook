package com.chaybook.backend.category.dto;

public record CategoryResponse(
        Integer categoryId,
        String name,
        String type
) {
}