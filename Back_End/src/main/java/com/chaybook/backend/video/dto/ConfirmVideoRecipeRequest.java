package com.chaybook.backend.video.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record ConfirmVideoRecipeRequest(
        @NotNull @PositiveOrZero Long version
) {
}