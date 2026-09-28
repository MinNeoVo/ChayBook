package com.chaybook.backend.category.service;

import com.chaybook.backend.category.dto.CategoryResponse;
import com.chaybook.backend.category.mapper.CategoryMapper;
import com.chaybook.backend.category.repository.CategoryRepository;
import com.chaybook.backend.category.service.CategoryIService;
import com.chaybook.backend.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CategoryService implements CategoryIService {
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public CategoryService(CategoryRepository categoryRepository, CategoryMapper categoryMapper) {
        this.categoryRepository = categoryRepository;
        this.categoryMapper = categoryMapper;
    }

    @Override
    public List<CategoryResponse> getCategories(String type) {
        var categories = StringUtils.hasText(type)
                ? categoryRepository.findByTypeIgnoreCaseOrderByCategoryIdAsc(type.trim())
                : categoryRepository.findAllByOrderByCategoryIdAsc();
        return categories.stream().map(categoryMapper::toResponse).toList();
    }

    @Override
    public CategoryResponse getCategory(Integer categoryId) {
        return categoryRepository.findById(categoryId)
                .map(categoryMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));
    }
}
