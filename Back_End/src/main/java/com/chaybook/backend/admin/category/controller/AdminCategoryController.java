package com.chaybook.backend.admin.category.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.chaybook.backend.admin.category.dto.AdminCategoryRequest;
import com.chaybook.backend.admin.category.dto.AdminCategoryResponse;
import com.chaybook.backend.admin.category.service.AdminCategoryIService;

import jakarta.validation.Valid;

@RestController 
@RequestMapping ("/api/admin/categories")
public class AdminCategoryController {

    private final AdminCategoryIService categoryService;

    public AdminCategoryController(
            AdminCategoryIService categoryService
    ) {
        this.categoryService = categoryService;
    }

    //helper requireAuthenticatedUserId
    private Integer requireAuthenticatedUserId(
        Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Vui lòng đăng nhập"
            );
        }

        try {
            Integer userId = Integer.valueOf(authentication.getName());

            if (userId <= 0) {
                throw new NumberFormatException();
            }

            return userId;
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Danh tính đăng nhập không hợp lệ"
            );
        }
    }

    //method
    @GetMapping
    public ResponseEntity<List<AdminCategoryResponse>> getCategories(
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "q", required = false) String q,
            Authentication authentication
    ) {
        Integer userId = requireAuthenticatedUserId(authentication);

        return ResponseEntity.ok(
                categoryService.getCategories(userId, type, q)
        );
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<AdminCategoryResponse> getCategoryDetail(
            @PathVariable("categoryId") Integer categoryId,
            Authentication authentication
    ) {
        Integer userId = requireAuthenticatedUserId(authentication);

        return ResponseEntity.ok(
                categoryService.getCategoryDetail(userId, categoryId)
        );
    }

    @PostMapping
    public ResponseEntity<AdminCategoryResponse> createCategory(
            @Valid @RequestBody AdminCategoryRequest request,
            Authentication authentication
    ) {
        Integer userId = requireAuthenticatedUserId(authentication);

        AdminCategoryResponse response =
                categoryService.createCategory(userId, request);

        URI location = URI.create(
                "/api/admin/categories/" + response.categoryId()
        );

        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<AdminCategoryResponse> updateCategory(
            @PathVariable("categoryId") Integer categoryId,
            @Valid @RequestBody AdminCategoryRequest request,
            Authentication authentication
    ) {
        Integer userId = requireAuthenticatedUserId(authentication);

        return ResponseEntity.ok(
                categoryService.updateCategory(userId, categoryId, request)
        );
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable("categoryId") Integer categoryId,
            Authentication authentication
    ) {
        Integer userId = requireAuthenticatedUserId(authentication);

        categoryService.deleteCategory(userId, categoryId);

        return ResponseEntity.noContent().build();
    }
}
