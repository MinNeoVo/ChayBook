package com.chaybook.backend.category.controller;

import com.chaybook.backend.category.dto.CategoryResponse;
import com.chaybook.backend.category.service.CategoryService;
import jakarta.validation.constraints.Positive;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<CategoryResponse> getCategories(@RequestParam(required = false) String type) {
        return categoryService.getCategories(type);
    }

    @GetMapping("/{categoryId}")
    public CategoryResponse getCategory(@PathVariable @Positive Integer categoryId) {
        return categoryService.getCategory(categoryId);
    }
}
