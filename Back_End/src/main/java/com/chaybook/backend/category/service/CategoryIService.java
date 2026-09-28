package com.chaybook.backend.category.service;

import com.chaybook.backend.category.dto.CategoryResponse;
import java.util.List;

public interface CategoryIService {
    List<CategoryResponse> getCategories(String type);
    CategoryResponse getCategory(Integer categoryId);
}
