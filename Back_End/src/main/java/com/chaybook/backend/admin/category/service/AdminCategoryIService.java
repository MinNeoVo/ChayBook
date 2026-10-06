package com.chaybook.backend.admin.category.service;

import java.util.List;

public interface AdminCategoryIService {

    List<AdminCategoryResponse> getCategories(
            Integer authenticatedUserId,
            String type,
            String q
    );

    AdminCategoryResponse getCategoryDetail(
            Integer authenticatedUserId,
            Integer categoryId
    );

    AdminCategoryResponse createCategory(
            Integer authenticatedUserId,
            AdminCategoryRequest request
    );

    AdminCategoryResponse updateCategory(
            Integer authenticatedUserId,
            Integer categoryId,
            AdminCategoryRequest request
    );

    void deleteCategory(
            Integer authenticatedUserId,
            Integer categoryId
    );
}