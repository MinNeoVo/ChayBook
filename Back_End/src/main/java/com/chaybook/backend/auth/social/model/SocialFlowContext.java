package com.chaybook.backend.auth.social.model;

import com.chaybook.backend.auth.social.dto.VerifiedSocialIdentity;
import com.chaybook.backend.auth.social.entity.SocialProvider;

import java.time.Instant;

public final class SocialFlowContext {

    private SocialFlowContext() {
    }

    public record Actor(
            Integer userId,
            String tokenFingerprint
    ) {
    }

    public record Registration(
            String challengeId,
            VerifiedSocialIdentity identity,
            Instant expiresAt
    ) {
    }

    public record LinkProof(
            String challengeId,
            Actor actor,
            String email,
            Instant expiresAt
    ) {
    }

    public record LinkIntent(
            String nonce,
            Actor actor,
            SocialProvider provider,
            Instant expiresAt
    ) {
    }
}