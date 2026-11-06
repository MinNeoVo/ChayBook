package com.chaybook.backend.auth.social.dto;

import com.chaybook.backend.auth.social.entity.SocialProvider;

/** Internal result of server-side provider verification; never accept this DTO as a request body. */
public record VerifiedSocialIdentity(
        SocialProvider provider,
        String subject,
        String email,
        boolean emailTrusted,
        String displayName,
        String avatarUrl
) {
}
