package com.chaybook.backend.shop.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "chaybook.geoapify")
public record GeoapifyProperties(
        @NotBlank String apiKey,

        @DefaultValue("3")
        @Min(1)
        @Max(30)
        int connectTimeoutSeconds,

        @DefaultValue("5")
        @Min(1)
        @Max(60)
        int readTimeoutSeconds
) {
}