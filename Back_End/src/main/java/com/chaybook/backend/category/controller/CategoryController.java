package com.chaybook.backend.category.controller;

import com.chaybook.backend.category.dto.CategoryResponse;
import com.chaybook.backend.category.service.impl.CategoryServiceImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(
        origins = "http://localhost:5173",
        allowCredentials = "true"
)
public class CategoryController {
    private final CategoryServiceImpl categoryService;

    public CategoryController(CategoryServiceImpl categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
public ResponseEntity<List<CategoryResponse>> getCategories(
        @RequestParam(name = "type", required = false) String type
) {
    return ResponseEntity.ok(categoryService.getCategories(type));
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
