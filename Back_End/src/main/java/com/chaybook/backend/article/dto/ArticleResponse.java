package com.chaybook.backend.article.dto;

import java.time.LocalDateTime;

public record ArticleResponse(
        Integer articleId,
        Integer categoryId,
        Integer createdBy,
        String title,
        String content,
        String coverImage,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private Integer articleId;
        private Integer categoryId;
        private Integer createdBy;
        private String title;
        private String content;
        private String coverImage;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        private Builder() {
        }

        public Builder articleId(Integer articleId) {
            this.articleId = articleId;
            return this;
        }

        public Builder categoryId(Integer categoryId) {
            this.categoryId = categoryId;
            return this;
        }

        public Builder createdBy(Integer createdBy) {
            this.createdBy = createdBy;
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

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public ArticleResponse build() {
            return new ArticleResponse(articleId, categoryId, createdBy, title, content, coverImage, status, createdAt, updatedAt);
        }
    }
}
