package com.chaybook.backend.category.service.impl;

import com.chaybook.backend.category.dto.CategoryResponse;
import com.chaybook.backend.category.entity.Category;
import com.chaybook.backend.category.repository.CategoryRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class CategoryServiceImpl {

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
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
            categories = categoryRepository.findByStatus(
                    "ACTIVE",
                    sort
            );
        } else {
            categories = categoryRepository.findByTypeAndStatus(
                    normalizedType,
                    "ACTIVE",
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

    public CategoryResponse getCategoryDetail(Integer categoryId) {
        if (categoryId == null || categoryId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Category ID must be greater than 0"
            );
        }

        Category category = categoryRepository.findById(categoryId)
                .filter(item -> "ACTIVE".equals(item.getStatus()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category not found"
                ));

        return new CategoryResponse(
                category.getCategoryId(),
                category.getName(),
                category.getType()
        );
    }
}