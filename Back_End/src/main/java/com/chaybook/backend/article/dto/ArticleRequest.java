package com.chaybook.backend.article.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ArticleRequest(
        @NotNull @Positive Integer categoryId,
        @NotBlank @Size(max = 255) String title,
        @NotBlank String content,
        @Size(max = 255) String coverImage,
        @NotBlank @Pattern(regexp = "DRAFT|PUBLISHED", message = "status must be DRAFT or PUBLISHED") String status
) {
    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private Integer categoryId;
        private String title;
        private String content;
        private String coverImage;
        private String status;

        private Builder() {
        }

        public Builder categoryId(Integer categoryId) {
            this.categoryId = categoryId;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder content(String content) {
            this.content = content;
            return this;
        }

        public Builder coverImage(String coverImage) {
            this.coverImage = coverImage;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public ArticleRequest build() {
            return new ArticleRequest(categoryId, title, content, coverImage, status);
        }
    }
}
