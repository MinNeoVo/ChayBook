package com.chaybook.backend.category.service;

import java.util.List;

public interface CategoryIService {

    List<CategoryResponse> getCategories(
            String type
    );

    CategoryResponse getCategoryDetail(
            Integer categoryId
    );
}