package com.chaybook.backend.category.service;

import com.chaybook.backend.category.dto.CategoryResponse;
import com.chaybook.backend.category.repository.CategoryRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryResponse> getCategories() {
        return categoryRepository.findAll(Sort.by("categoryId"))
                .stream()
                .map(category -> new CategoryResponse(
                        category.getCategoryId(),
                        category.getName()
                ))
                .toList();
    }
}
