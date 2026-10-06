package com.chaybook.backend.admin.user.dto;

import jakarta.validation.constraints.*;

public record UpdateUserStatusRequest(
        @NotBlank(message = "Status is required")
        @Pattern(
                regexp = "ACTIVE|DISABLED",
                message = "Status must be ACTIVE or DISABLED"
        )
        String status
) {
}
