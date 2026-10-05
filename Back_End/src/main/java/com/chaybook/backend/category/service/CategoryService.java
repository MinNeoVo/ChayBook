package com.chaybook.backend.category.service;

import com.chaybook.backend.category.dto.CategoryResponse;
import com.chaybook.backend.category.entity.Category;
import com.chaybook.backend.category.repository.CategoryRepository;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryResponse> getCategories(String type) {

        String normalizedType = normalizeType(type);

        Sort sort = Sort.by(
                Sort.Direction.ASC,
                "categoryId"
        );

        List<Category> categories;

        if (normalizedType == null) {
            categories = categoryRepository.findAll(sort);
        } else {
            categories = categoryRepository.findByType(
                    normalizedType,
                    sort
            );
        }

        return categories.stream()
                .map(category -> new CategoryResponse(
                        category.getCategoryId(),
                        category.getName(),
                        category.getType()
                ))
                .toList();
    }

    private String normalizeType(String type) {

        if (type == null || type.isBlank()) {
            return null;
        }

        return type.strip().toUpperCase(Locale.ROOT);
    }
}