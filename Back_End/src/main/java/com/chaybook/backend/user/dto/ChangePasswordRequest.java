package com.chaybook.backend.user.dto;

import jakarta.validation.constraints.*;

public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required")
        @Size(max = 72, message = "Current password is too long")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @Size(
                min = 8,
                max = 72,
                message = "New password must contain 8 to 72 characters"
        )
        String newPassword
) {
}
