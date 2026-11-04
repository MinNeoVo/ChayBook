package com.chaybook.backend.auth.social.dto;

import com.chaybook.backend.user.entity.User;

import java.util.Objects;

/** Internal service result. A pending registration must not receive a ChayBook login token. */
public record SocialLoginResolution(User user, boolean registrationRequired) {
    public SocialLoginResolution {
        if (registrationRequired != (user == null)) {
            throw new IllegalArgumentException("A login result must contain either a user or a pending registration.");
        }
    }

    public static SocialLoginResolution authenticated(User user) {
        return new SocialLoginResolution(Objects.requireNonNull(user), false);
    }

    public static SocialLoginResolution registrationPending() {
        return new SocialLoginResolution(null, true);
    }
}
