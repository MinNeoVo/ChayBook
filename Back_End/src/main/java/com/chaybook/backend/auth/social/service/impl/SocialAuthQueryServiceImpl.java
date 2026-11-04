package com.chaybook.backend.auth.social.service.impl;

import com.chaybook.backend.auth.social.config.SocialAuthProperties;
import com.chaybook.backend.auth.social.dto.SocialConnectionResponse;
import com.chaybook.backend.auth.social.dto.SocialConnectionsViewResponse;
import com.chaybook.backend.auth.social.dto.SocialLinkedProviderResponse;
import com.chaybook.backend.auth.social.dto.SocialProviderResponse;
import com.chaybook.backend.auth.social.dto.SocialProvidersResponse;
import com.chaybook.backend.auth.social.entity.SocialProvider;
import com.chaybook.backend.auth.social.service.SocialAccountService;
import com.chaybook.backend.auth.social.service.SocialAuthQueryService;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SocialAuthQueryServiceImpl implements SocialAuthQueryService {

    private final SocialAccountService socialAccountService;
    private final SocialAuthProperties properties;

    public SocialAuthQueryServiceImpl(
            SocialAccountService socialAccountService,
            SocialAuthProperties properties
    ) {
        this.socialAccountService = socialAccountService;
        this.properties = properties;
    }

    @Override
    public SocialProvidersResponse getProviders() {
        var providers = Arrays.stream(SocialProvider.values())
                .map(provider -> new SocialProviderResponse(
                        providerId(provider),
                        isEnabled(provider)
                ))
                .toList();

        return new SocialProvidersResponse(providers);
    }

    @Override
    public SocialConnectionsViewResponse getConnections(Integer userId) {
        var accountConnections = socialAccountService.connections(userId);

        Set<SocialProvider> linkedProviders =
                accountConnections.connections().stream()
                        .map(SocialConnectionResponse::provider)
                        .collect(Collectors.toSet());

        var providers = Arrays.stream(SocialProvider.values())
                .map(provider -> new SocialLinkedProviderResponse(
                        providerId(provider),
                        linkedProviders.contains(provider),
                        isEnabled(provider)
                ))
                .toList();

        return new SocialConnectionsViewResponse(
                accountConnections.hasPassword(),
                providers
        );
    }

    private String providerId(SocialProvider provider) {
        return provider.name().toLowerCase(Locale.ROOT);
    }

    private boolean isEnabled(SocialProvider provider) {
        if (!properties.isLoginEnabled()) {
            return false;
        }

        return switch (provider) {
            case GOOGLE -> properties.getGoogle().isConfigured();
            case FACEBOOK -> properties.getFacebook().isConfigured();
        };
    }
}