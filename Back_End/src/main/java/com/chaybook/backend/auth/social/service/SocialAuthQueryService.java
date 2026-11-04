package com.chaybook.backend.auth.social.service;

import com.chaybook.backend.auth.social.dto.SocialConnectionsViewResponse;
import com.chaybook.backend.auth.social.dto.SocialProvidersResponse;

public interface SocialAuthQueryService {

    SocialProvidersResponse getProviders();

    SocialConnectionsViewResponse getConnections(Integer userId);
}