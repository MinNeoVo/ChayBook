package com.chaybook.backend.auth.social.dto;

import com.chaybook.backend.auth.social.entity.SocialProvider;

import java.time.LocalDateTime;

public record SocialConnectionResponse(SocialProvider provider, LocalDateTime linkedAt) {
}
