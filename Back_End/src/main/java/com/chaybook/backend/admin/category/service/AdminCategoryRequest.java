package com.chaybook.backend.admin.category.service;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminCategoryRequest(
        @NotBlank(message = "Tên Category không được để trống")
        @Size(max = 255, message = "Tên Category tối đa 255 ký tự")
        String name,

        @NotBlank(message = "Type không được để trống")
        @Pattern(
                regexp = "ARTICLE|RECIPE|POST",
                message = "Type phải là ARTICLE, RECIPE hoặc POST"
        )
        String type,

        String description
) {
}