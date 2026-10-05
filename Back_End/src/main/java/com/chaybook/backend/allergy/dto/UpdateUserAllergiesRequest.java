package com.chaybook.backend.allergy.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record UpdateUserAllergiesRequest(
        @NotNull(message = "allergyIds is required")
        List<@NotNull(message = "Allergy ID must not be null")
                @Positive(message = "Allergy ID must be greater than 0") Integer> allergyIds
) {
}
