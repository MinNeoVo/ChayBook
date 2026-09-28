package com.chaybook.backend.common.dto;

public record MessageResponse(
        String message
) {
    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private String message;

        private Builder() {
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public MessageResponse build() {
            return new MessageResponse(message);
        }
    }
}
