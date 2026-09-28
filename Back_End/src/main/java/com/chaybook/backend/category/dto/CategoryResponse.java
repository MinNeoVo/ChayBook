package com.chaybook.backend.category.dto;

public record CategoryResponse(
        Integer categoryId,
        String name,
        String type,
        String description
) {
    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private Integer categoryId;
        private String name;
        private String type;
        private String description;

        private Builder() {
        }

        public Builder categoryId(Integer categoryId) {
            this.categoryId = categoryId;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder type(String type) {
            this.type = type;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public CategoryResponse build() {
            return new CategoryResponse(categoryId, name, type, description);
        }
    }
}
