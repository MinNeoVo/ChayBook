package com.chaybook.backend.auth.social.dto;

import java.util.List;

public record SocialConnectionsResponse(boolean hasPassword, List<SocialConnectionResponse> connections) {
    public SocialConnectionsResponse {
        connections = List.copyOf(connections);
    }
}
