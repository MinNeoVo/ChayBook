package com.chaybook.backend.community.dto;

import jakarta.validation.constraints.*;

public record PostInteractionRequest(
        @NotBlank(message = "Interaction type is required")
        @Pattern(
                regexp = "LIKE|BOOKMARK",
                message = "Interaction type must be LIKE or BOOKMARK"
        )
        String type
) {
}
