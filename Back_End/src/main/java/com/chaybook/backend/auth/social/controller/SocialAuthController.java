package com.chaybook.backend.auth.social.controller;

import com.chaybook.backend.auth.social.dto.SocialConnectionsViewResponse;
import com.chaybook.backend.auth.social.dto.SocialCsrfResponse;
import com.chaybook.backend.auth.social.dto.SocialProvidersResponse;
import com.chaybook.backend.auth.social.exception.SocialAuthException;
import com.chaybook.backend.auth.social.oauth.SocialWebSupport;
import com.chaybook.backend.auth.social.service.SocialAuthQueryService;
import com.chaybook.backend.auth.social.service.SocialLinkService;
import com.chaybook.backend.auth.social.service.SocialRegistrationService;
import com.chaybook.backend.auth.social.dto.SocialFlowDtos.*;
import com.chaybook.backend.auth.social.model.SocialFlowContext.LinkProof;
import com.chaybook.backend.auth.social.model.SocialFlowContext.Registration;
import com.chaybook.backend.auth.social.oauth.SocialWebSupport;
import com.chaybook.backend.auth.social.service.SocialLinkService;
import com.chaybook.backend.auth.social.service.SocialRegistrationService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.Instant;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/social")
public class SocialAuthController {

    private final SocialAuthQueryService queryService;
    private final SocialRegistrationService registrations;
    private final SocialLinkService links;
    private final SocialWebSupport web;

    public SocialAuthController(
        SocialAuthQueryService queryService,
        SocialRegistrationService registrations,
        SocialLinkService links,
        SocialWebSupport web
    ) {
        this.queryService = queryService;
        this.registrations = registrations;
        this.links = links;
        this.web = web;
    }

    @GetMapping("/providers")
    public ResponseEntity<SocialProvidersResponse> getProviders() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(queryService.getProviders());
    }

    @GetMapping("/csrf")
    public ResponseEntity<SocialCsrfResponse> getCsrf(
            CsrfToken csrfToken,
            HttpServletRequest request
    ) {
        String token = csrfToken.getToken();

        request.getSession().setMaxInactiveInterval(10 * 60);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(new SocialCsrfResponse(
                        token,
                        csrfToken.getHeaderName()
                ));
    }

    @GetMapping("/connections")
    public ResponseEntity<SocialConnectionsViewResponse> getConnections(
            Authentication authentication
    ) {
        Integer userId = requireAuthenticatedUserId(authentication);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(queryService.getConnections(userId));
    }

    @GetMapping("/pending")
    public ResponseEntity<PendingResponse> getPending(
            HttpServletRequest request
    ) {
        Registration registration = web.read(
                request,
                SocialWebSupport.REGISTRATION,
                Registration.class
        );

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(registrations.getPending(registration));
    }

    @PostMapping("/registration/code")
    public ResponseEntity<Void> requestRegistrationCode(
            @Valid @RequestBody EmailRequest body,
            HttpServletRequest request
    ) {
        Registration registration = web.read(
                request,
                SocialWebSupport.REGISTRATION,
                Registration.class
        );

        registrations.requestCode(registration, body.email());

        return ResponseEntity.noContent()
                .cacheControl(CacheControl.noStore())
                .build();
    }

    @PostMapping("/registration/complete")
    public ResponseEntity<SessionResponse> completeRegistration(
            @Valid @RequestBody RegistrationRequest body,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        Registration registration = web.read(
                request,
                SocialWebSupport.REGISTRATION,
                Registration.class
        );

        var user = registrations.complete(
                registration,
                body.email(),
                body.code()
        );

        var currentUser = web.signIn(user, request, response);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(new SessionResponse(currentUser));
    }

    @PostMapping("/link/code")
    public ResponseEntity<Void> requestLinkCode(
            Authentication authentication,
            HttpServletRequest request
    ) {
        var actor = web.actor(authentication);

        LinkProof proof = web.read(
                request,
                SocialWebSupport.LINK_PROOF,
                LinkProof.class
        );

        if (proof == null
                || !proof.actor().equals(actor)
                || !Instant.now().isBefore(proof.expiresAt())) {
            proof = links.createProof(actor);
            web.put(request, SocialWebSupport.LINK_PROOF, proof);
        }

        links.requestCode(proof, actor);

        return ResponseEntity.noContent()
                .cacheControl(CacheControl.noStore())
                .build();
    }

    @PostMapping("/link/{provider}")
    public ResponseEntity<AuthorizationResponse> prepareLink(
            @PathVariable String provider,
            @Valid @RequestBody LinkRequest body,
            Authentication authentication,
            HttpServletRequest request
    ) {
        var actor = web.actor(authentication);

        LinkProof proof = web.read(
                request,
                SocialWebSupport.LINK_PROOF,
                LinkProof.class
        );

        var intent = links.prepare(
                actor,
                web.provider(provider),
                body,
                proof
        );

        web.put(request, SocialWebSupport.LINK_INTENT, intent);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(new AuthorizationResponse(
                        web.authorizationUrl(intent.provider(), intent.nonce())
                ));
    }

    private Integer requireAuthenticatedUserId(
            Authentication authentication
    ) {
        if (!(authentication instanceof JwtAuthenticationToken jwt)
                || !authentication.isAuthenticated()) {
            throw authenticationRequired();
        }

        try {
            Integer userId = Integer.valueOf(
                    jwt.getToken().getSubject()
            );

            if (userId <= 0) {
                throw authenticationRequired();
            }

            return userId;
        } catch (NumberFormatException exception) {
            throw authenticationRequired();
        }
    }

    private SocialAuthException authenticationRequired() {
        return new SocialAuthException(
                HttpStatus.UNAUTHORIZED,
                "AUTHENTICATION_REQUIRED",
                "Vui lòng đăng nhập lại."
        );
    }
}