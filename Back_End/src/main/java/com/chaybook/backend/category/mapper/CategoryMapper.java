package com.chaybook.backend.category.mapper;

import com.chaybook.backend.category.dto.CategoryResponse;
import com.chaybook.backend.category.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {
    public CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .categoryId(category.getCategoryId())
                .name(category.getName())
                .type(category.getType())
                .description(category.getDescription())
                .build();
    }
}
