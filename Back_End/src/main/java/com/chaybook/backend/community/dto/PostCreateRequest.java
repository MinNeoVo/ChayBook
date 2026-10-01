package com.chaybook.backend.community.dto;

import jakarta.validation.constraints.*;

public record PostCreateRequest(
        @Positive(message = "categoryId must be greater than 0")
        Integer categoryId,

        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must not exceed 255 characters")
        String title,

        @NotBlank(message = "Content is required")
        String content,

        @Size(max = 255, message = "Image URL must not exceed 255 characters")
        String imageUrl
) {
}
