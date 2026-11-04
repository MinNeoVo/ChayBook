package com.chaybook.backend.auth.social.dto;

import java.util.List;

public record SocialProvidersResponse(
        List<SocialProviderResponse> providers
) {
    public SocialProvidersResponse {
        providers = List.copyOf(providers);
    }
}