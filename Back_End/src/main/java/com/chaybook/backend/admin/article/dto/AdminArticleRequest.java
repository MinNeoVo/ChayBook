package com.chaybook.backend.admin.article.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record AdminArticleRequest(
        @NotNull(message = "Category ID là bắt buộc")
        @Positive(message = "Category ID phải lớn hơn 0")
        Integer categoryId,

        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(max = 255, message = "Tiêu đề tối đa 255 ký tự")
        String title,

        @NotBlank(message = "Nội dung không được để trống")
        String content,

        @Size(max = 255, message = "Cover image tối đa 255 ký tự")
        String coverImage,

        @NotBlank(message = "Trạng thái là bắt buộc")
        @Pattern(
                regexp = "DRAFT|PUBLISHED",
                message = "Trạng thái phải là DRAFT hoặc PUBLISHED"
        )
        String status
) {
}