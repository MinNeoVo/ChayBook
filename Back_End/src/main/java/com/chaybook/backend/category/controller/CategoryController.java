package com.chaybook.backend.category.controller;

import com.chaybook.backend.category.service.CategoryIService;
import com.chaybook.backend.category.service.CategoryResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryIService categoryService;

    public CategoryController(
            CategoryIService categoryService
    ) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getCategories(
            @RequestParam(
                    name = "type",
                    required = false
            ) String type
    ) {
        return ResponseEntity.ok(
                categoryService.getCategories(type)
        );
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> getCategoryDetail(
            @PathVariable("categoryId") Integer categoryId
    ) {
        return ResponseEntity.ok(
                categoryService.getCategoryDetail(categoryId)
        );
    }
}