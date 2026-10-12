package com.chaybook.backend.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentUpdateRequest(
        @NotBlank(message = "Nội dung không được để trống")
        @Size(max = 2000, message = "Nội dung không được vượt quá 2.000 ký tự")
        String content
) {
}