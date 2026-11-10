package com.chaybook.backend.auth.social.service;

import com.chaybook.backend.auth.social.dto.SocialConnectionsResponse;
import com.chaybook.backend.auth.social.dto.SocialLoginResolution;
import com.chaybook.backend.auth.social.dto.VerifiedSocialIdentity;
import com.chaybook.backend.user.entity.User;

public interface SocialAccountService {
    SocialLoginResolution resolveLogin(VerifiedSocialIdentity identity);

    /** Caller must verify ownership of verifiedEmail with a challenge bound to this identity. */
    User completeRegistration(VerifiedSocialIdentity identity, String verifiedEmail);

    /** Caller must validate fresh reauthentication and an OAuth link intent bound to userId. */
    void link(Integer userId, VerifiedSocialIdentity identity);

    SocialConnectionsResponse connections(Integer userId);
}
