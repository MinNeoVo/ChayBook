package com.chaybook.backend.article.service;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ArticleRequest(
        @NotNull(message = "Category ID is required")
        @Positive(message = "Category ID must be greater than 0")
        Integer categoryId,

        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must not exceed 255 characters")
        String title,

        @NotBlank(message = "Content is required")
        String content,

        @Size(max = 255, message = "Cover image must not exceed 255 characters")
        String coverImage,

        @NotBlank(message = "Status is required")
        @Pattern(
                regexp = "DRAFT|PUBLISHED",
                message = "Status must be DRAFT or PUBLISHED"
        )
        String status
) {
}