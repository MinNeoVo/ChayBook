package com.chaybook.backend.auth.social.dto;

public record SocialLinkedProviderResponse(
        String provider,
        boolean linked,
        boolean enabled
) {
}