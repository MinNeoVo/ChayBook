package com.chaybook.backend.category.service;

import com.chaybook.backend.category.entity.Category;
import com.chaybook.backend.category.repository.CategoryRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class CategoryService implements CategoryIService {

    private final CategoryRepository categoryRepository;

    public CategoryService(
            CategoryRepository categoryRepository
    ) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public List<CategoryResponse> getCategories(
            String type
    ) {
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

        List<CategoryResponse> responses = new ArrayList<>();

        for (Category category : categories) {
            responses.add(toResponse(category));
        }

        return responses;
    }

    @Override
    public CategoryResponse getCategoryDetail(
            Integer categoryId
    ) {
        Category category = requireCategory(categoryId);

        return toResponse(category);
    }

    private Category requireCategory(
            Integer categoryId
    ) {
        if (categoryId == null || categoryId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Category ID must be greater than 0"
            );
        }

        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category not found"
                ));
    }

    private String normalizeType(
            String type
    ) {
        if (type == null || type.isBlank()) {
            return null;
        }

        return type.strip()
                .toUpperCase(Locale.ROOT);
    }

    private CategoryResponse toResponse(
            Category category
    ) {
        return new CategoryResponse(
                category.getCategoryId(),
                category.getName(),
                category.getType(),
                category.getDescription()
        );
    }
}