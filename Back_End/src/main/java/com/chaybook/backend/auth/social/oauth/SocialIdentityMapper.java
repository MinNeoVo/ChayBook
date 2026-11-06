package com.chaybook.backend.auth.social.oauth;

import com.chaybook.backend.auth.social.dto.VerifiedSocialIdentity;
import com.chaybook.backend.auth.social.entity.SocialProvider;
import com.chaybook.backend.auth.social.exception.SocialAuthException;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Map;

@Component
public class SocialIdentityMapper {

    public VerifiedSocialIdentity map(OAuth2AuthenticationToken authentication) {
        return switch (authentication.getAuthorizedClientRegistrationId()) {
            case "google" -> google(authentication.getPrincipal());
            case "facebook" -> facebook(authentication.getPrincipal());
            default -> throw invalidIdentity();
        };
    }

    private VerifiedSocialIdentity google(OAuth2User principal) {
        if (!(principal instanceof OidcUser user)) {
            throw invalidIdentity();
        }

        var token = user.getIdToken();

        String email = token.getEmail();
        String hostedDomain = token.getClaimAsString("hd");

        boolean verified = Boolean.TRUE.equals(token.getEmailVerified());

        boolean authoritativeEmail = email != null
                && verified
                && (email.toLowerCase(Locale.ROOT).endsWith("@gmail.com")
                    || (hostedDomain != null && !hostedDomain.isBlank()));

        return new VerifiedSocialIdentity(
                SocialProvider.GOOGLE,
                token.getSubject(),
                email,
                authoritativeEmail,
                user.getFullName(),
                user.getPicture()
        );
    }

    private VerifiedSocialIdentity facebook(OAuth2User principal) {
        String subject = text(principal.getAttribute("id"));

        if (subject == null || subject.isBlank()) {
            throw invalidIdentity();
        }

        return new VerifiedSocialIdentity(
                SocialProvider.FACEBOOK,
                subject,
                text(principal.getAttribute("email")),
                false,
                text(principal.getAttribute("name")),
                facebookPicture(principal.getAttribute("picture"))
        );
    }

    private String facebookPicture(Object picture) {
        if (picture instanceof Map<?, ?> pictureMap
                && pictureMap.get("data") instanceof Map<?, ?> data) {
            return text(data.get("url"));
        }

        return null;
    }

    private String text(Object value) {
        return value instanceof String text ? text : null;
    }

    private SocialAuthException invalidIdentity() {
        return new SocialAuthException(
                HttpStatus.BAD_REQUEST,
                "INVALID_TOKEN",
                "Không thể xác minh danh tính từ nhà cung cấp."
        );
    }
}