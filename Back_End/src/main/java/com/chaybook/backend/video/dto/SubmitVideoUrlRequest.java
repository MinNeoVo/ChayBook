package com.chaybook.backend.video.dto;
import jakarta.validation.constraints.*;
public record SubmitVideoUrlRequest(
        @NotBlank @Size(max = 2048) String url,
        boolean includeSummary
) {}
