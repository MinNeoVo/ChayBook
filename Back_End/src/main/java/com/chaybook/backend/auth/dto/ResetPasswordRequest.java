package com.chaybook.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(max = 100) String resetToken,
        @NotBlank @Size(min = 8, max = 72) String newPassword
) {}
