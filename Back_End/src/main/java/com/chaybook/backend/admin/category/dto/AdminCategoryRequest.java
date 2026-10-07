package com.chaybook.backend.admin.category.dto;

import jakarta.validation.constraints.*;

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