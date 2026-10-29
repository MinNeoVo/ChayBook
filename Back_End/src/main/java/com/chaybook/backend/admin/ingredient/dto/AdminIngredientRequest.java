package com.chaybook.backend.admin.ingredient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminIngredientRequest(
        @NotBlank(message = "Vui lòng nhập tên nguyên liệu.")
        @Size(max = 255, message = "Tên nguyên liệu không được vượt quá 255 ký tự")
        String name,

        @Size(max = 5000, message = "Mô tả nguyên liệu không được vượt quá 5000 ký tự")
        String description
) {
    public AdminIngredientRequest {
        name = name == null ? null : name.strip();

        description = description == null || description.isBlank()
                ? null
                : description.strip();
    }
}