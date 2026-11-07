package com.chaybook.backend.video.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record UpdateVideoDraftRequest(
        @NotNull @PositiveOrZero Long version,
        @NotNull VideoRecipeDraft draft
) {
}