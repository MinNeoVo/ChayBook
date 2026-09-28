package com.chaybook.backend.article.dto;

import java.time.LocalDateTime;

public record ArticleSummaryResponse(
        Integer articleId,
        Integer categoryId,
        Integer createdBy,
        String title,
        String coverImage,
        String status,
        LocalDateTime createdAt
) {
    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private Integer articleId;
        private Integer categoryId;
        private Integer createdBy;
        private String title;
        private String coverImage;
        private String status;
        private LocalDateTime createdAt;

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

        public ArticleSummaryResponse build() {
            return new ArticleSummaryResponse(articleId, categoryId, createdBy, title, coverImage, status, createdAt);
        }
    }
}
