package com.chaybook.backend.auth.social.oauth;

import com.chaybook.backend.auth.social.exception.SocialAuthException;
import com.chaybook.backend.auth.social.model.SocialFlowContext.LinkIntent;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class SocialAuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    public static final String COMPLETED_REQUEST =
            SocialAuthorizationRequestRepository.class.getName() + ".COMPLETED";

    public static final String EXPIRES_AT = "social.expiresAt";
    public static final String LINK = "social.link";

    private final HttpSessionOAuth2AuthorizationRequestRepository delegate =
            new HttpSessionOAuth2AuthorizationRequestRepository();

    private final SocialWebSupport web;

    public SocialAuthorizationRequestRepository(SocialWebSupport web) {
        this.web = web;
    }

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(
            HttpServletRequest request
    ) {
        return delegate.loadAuthorizationRequest(request);
    }

    @Override
    public void saveAuthorizationRequest(
            OAuth2AuthorizationRequest authorizationRequest,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        if (authorizationRequest == null) {
            delegate.saveAuthorizationRequest(null, request, response);
            return;
        }

        HttpSession session = request.getSession();
        session.setMaxInactiveInterval(600);

        synchronized (session) {
            LinkIntent intent = consumeIntent(request, authorizationRequest);

            OAuth2AuthorizationRequest stored =
                    OAuth2AuthorizationRequest.from(authorizationRequest)
                            .attributes(attributes -> {
                                attributes.put(
                                        EXPIRES_AT,
                                        Instant.now().plusSeconds(300)
                                );

                                if (intent != null) {
                                    attributes.put(LINK, intent);
                                }
                            })
                            .build();

            delegate.saveAuthorizationRequest(stored, request, response);
        }
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        HttpSession session = request.getSession(false);

        if (session == null) {
            return null;
        }

        synchronized (session) {
            OAuth2AuthorizationRequest stored =
                    delegate.removeAuthorizationRequest(request, response);

            if (stored != null) {
                request.setAttribute(COMPLETED_REQUEST, stored);
            }

            return stored;
        }
    }

    private LinkIntent consumeIntent(
            HttpServletRequest request,
            OAuth2AuthorizationRequest authorizationRequest
    ) {
        String nonce = request.getParameter("intent");

        // Không có intent: đây là lượt đăng nhập thông thường.
        if (nonce == null) {
            return null;
        }

        LinkIntent intent = web.read(
                request,
                SocialWebSupport.LINK_INTENT,
                LinkIntent.class
        );

        String registrationId = authorizationRequest.getAttribute(
                "registration_id"
        );

        if (intent == null
                || !intent.nonce().equals(nonce)
                || !Instant.now().isBefore(intent.expiresAt())
                || !intent.provider().name().equalsIgnoreCase(registrationId)) {
            throw oauthError("INVALID_STATE");
        }

        try {
            if (!intent.actor().equals(web.actor(request))) {
                throw oauthError("LINK_SESSION_CHANGED");
            }
        } catch (SocialAuthException exception) {
            throw oauthError("LINK_SESSION_CHANGED");
        }

        request.getSession().removeAttribute(SocialWebSupport.LINK_INTENT);
        return intent;
    }

    private OAuth2AuthenticationException oauthError(String code) {
        return new OAuth2AuthenticationException(new OAuth2Error(code));
    }
}