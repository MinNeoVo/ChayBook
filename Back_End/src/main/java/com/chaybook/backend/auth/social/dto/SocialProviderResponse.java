package com.chaybook.backend.auth.social.dto;

public record SocialProviderResponse(
        String provider,
        boolean enabled
) {
}