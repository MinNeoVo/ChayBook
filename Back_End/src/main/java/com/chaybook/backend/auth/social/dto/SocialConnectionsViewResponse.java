package com.chaybook.backend.auth.social.dto;

import java.util.List;

public record SocialConnectionsViewResponse(
        boolean hasPassword,
        List<SocialLinkedProviderResponse> providers
) {
    public SocialConnectionsViewResponse {
        providers = List.copyOf(providers);
    }
}