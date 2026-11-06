package com.chaybook.backend.auth.social.oauth;

import com.chaybook.backend.auth.social.exception.SocialAuthException;
import com.chaybook.backend.auth.social.model.SocialFlowContext.LinkIntent;
import com.chaybook.backend.auth.social.service.SocialAccountService;
import com.chaybook.backend.auth.social.service.SocialLinkService;
import com.chaybook.backend.auth.social.service.SocialRegistrationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

@Component
public class SocialOAuthHandlers {

    private static final Logger log =
            LoggerFactory.getLogger(SocialOAuthHandlers.class);

    private final SocialIdentityMapper mapper;
    private final SocialAccountService accounts;
    private final SocialRegistrationService registrations;
    private final SocialLinkService links;
    private final SocialWebSupport web;

    public SocialOAuthHandlers(
            SocialIdentityMapper mapper,
            SocialAccountService accounts,
            SocialRegistrationService registrations,
            SocialLinkService links,
            SocialWebSupport web
    ) {
        this.mapper = mapper;
        this.accounts = accounts;
        this.registrations = registrations;
        this.links = links;
        this.web = web;
    }

    public void success(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        try {
            if (!(authentication instanceof OAuth2AuthenticationToken oauth)) {
                throw invalidState();
            }

            Object saved = request.getAttribute(
                    SocialAuthorizationRequestRepository.COMPLETED_REQUEST
            );

            if (!(saved instanceof OAuth2AuthorizationRequest authorization)) {
                throw invalidState();
            }

            Instant expiresAt = authorization.getAttribute(
                    SocialAuthorizationRequestRepository.EXPIRES_AT
            );

            if (expiresAt == null || !Instant.now().isBefore(expiresAt)) {
                throw invalidState();
            }

            var identity = mapper.map(oauth);

            LinkIntent intent = authorization.getAttribute(
                    SocialAuthorizationRequestRepository.LINK
            );

            if (intent != null) {
                links.complete(intent, web.actor(request), identity);

                web.clearSession(request);
                web.redirect(response, "result", "linked");
                return;
            }

            var resolution = accounts.resolveLogin(identity);

            if (resolution.registrationRequired()) {
                web.clearSession(request);
                web.clearLoginCookie(response);

                web.put(
                        request,
                        SocialWebSupport.REGISTRATION,
                        registrations.begin(identity)
                );

                web.redirect(response, "result", "registration_required");
                return;
            }

            web.signIn(resolution.user(), request, response);
            web.redirect(response, "result", "success");

        } catch (SocialAuthException exception) {
            web.clearSession(request);
            web.redirect(response, "error", exception.getCode());

        } catch (RuntimeException exception) {
            log.error(
                    "Social authentication failed with {}",
                    exception.getClass().getSimpleName()
            );

            web.clearSession(request);
            web.redirect(response, "error", "OAUTH_FAILED");

        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    public void failure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException {
        String code = "OAUTH_FAILED";

        if (exception instanceof OAuth2AuthenticationException oauth) {
            code = switch (oauth.getError().getErrorCode()) {
                case "access_denied" -> "ACCESS_DENIED";

                case "invalid_state_parameter",
                     "authorization_request_not_found",
                     "INVALID_STATE" -> "INVALID_STATE";

                case "LINK_SESSION_CHANGED" -> "LINK_SESSION_CHANGED";

                default -> "OAUTH_FAILED";
            };
        }

        SecurityContextHolder.clearContext();
        web.clearSession(request);
        web.redirect(response, "error", code);
    }

    private SocialAuthException invalidState() {
        return new SocialAuthException(
                HttpStatus.BAD_REQUEST,
                "INVALID_STATE",
                "Lượt xác thực không hợp lệ hoặc đã hết hạn."
        );
    }
}