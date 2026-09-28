package com.chaybook.backend.auth.dto;

public record LoginResponse(
        String message,
        UserData user
) {
    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private String message;
        private UserData user;

        private Builder() {
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public Builder user(UserData user) {
            this.user = user;
            return this;
        }

        public LoginResponse build() {
            return new LoginResponse(message, user);
        }
    }

    public record UserData(
            Integer userId,
            String username,
            String email,
            String fullName,
            String role
    ) {
        public static Builder builder() {
            return new Builder();
        }

        public static final class Builder {
            private Integer userId;
            private String username;
            private String email;
            private String fullName;
            private String role;

            private Builder() {
            }

            public Builder userId(Integer userId) {
                this.userId = userId;
                return this;
            }

            public Builder username(String username) {
                this.username = username;
                return this;
            }

            public Builder email(String email) {
                this.email = email;
                return this;
            }

            public Builder fullName(String fullName) {
                this.fullName = fullName;
                return this;
            }

            public Builder role(String role) {
                this.role = role;
                return this;
            }

            public UserData build() {
                return new UserData(userId, username, email, fullName, role);
            }
        }
    }
}
