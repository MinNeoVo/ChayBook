package com.chaybook.backend.auth.social.oauth;

import com.chaybook.backend.auth.dto.MeResponse;
import com.chaybook.backend.auth.social.config.SocialAuthProperties;
import com.chaybook.backend.auth.social.entity.SocialProvider;
import com.chaybook.backend.auth.social.exception.SocialAuthException;
import com.chaybook.backend.auth.social.model.SocialFlowContext.Actor;
import com.chaybook.backend.security.JwtService;
import com.chaybook.backend.user.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;

@Component
public class SocialWebSupport {

    public static final String REGISTRATION =
            SocialWebSupport.class.getName() + ".REGISTRATION";

    public static final String LINK_PROOF =
            SocialWebSupport.class.getName() + ".LINK_PROOF";

    public static final String LINK_INTENT =
            SocialWebSupport.class.getName() + ".LINK_INTENT";

    private final SocialAuthProperties properties;
    private final JwtService jwtService;
    private final JwtDecoder jwtDecoder;
    private final BearerTokenResolver tokenResolver;

    public SocialWebSupport(
            SocialAuthProperties properties,
            JwtService jwtService,
            JwtDecoder jwtDecoder,
            BearerTokenResolver tokenResolver
    ) {
        this.properties = properties;
        this.jwtService = jwtService;
        this.jwtDecoder = jwtDecoder;
        this.tokenResolver = tokenResolver;
    }

    public Actor actor(Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken jwt)
                || !authentication.isAuthenticated()) {
            throw authenticationRequired();
        }

        return actor(jwt.getToken());
    }

    public Actor actor(HttpServletRequest request) {
        String token = tokenResolver.resolve(request);

        if (token == null || token.isBlank()) {
            throw authenticationRequired();
        }

        try {
            return actor(jwtDecoder.decode(token));
        } catch (JwtException exception) {
            throw authenticationRequired();
        }
    }

    private Actor actor(Jwt jwt) {
        try {
            Integer userId = Integer.valueOf(jwt.getSubject());

            if (userId <= 0) {
                throw authenticationRequired();
            }

            return new Actor(userId, fingerprint(jwt.getTokenValue()));
        } catch (NumberFormatException exception) {
            throw authenticationRequired();
        }
    }

    public <T> T read(
            HttpServletRequest request,
            String key,
            Class<T> type
    ) {
        HttpSession session = request.getSession(false);

        if (session == null) {
            return null;
        }

        Object value = session.getAttribute(key);
        return type.isInstance(value) ? type.cast(value) : null;
    }

    public void put(
            HttpServletRequest request,
            String key,
            Object value
    ) {
        HttpSession session = request.getSession();
        session.setMaxInactiveInterval(600);
        session.setAttribute(key, value);
    }

    public void clearSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session != null) {
            session.invalidate();
        }
    }

    public MeResponse signIn(
            User user,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String token = jwtService.generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getRole()
        );

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie(token, 3600).toString()
        );

        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        clearSession(request);

        return new MeResponse(
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getRole()
        );
    }

    public void clearLoginCookie(HttpServletResponse response) {
        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie("", 0).toString()
        );
    }

    public String authorizationUrl(
            SocialProvider provider,
            String nonce
    ) {
        return UriComponentsBuilder
                .fromUriString(properties.getBackendUrl())
                .path("/oauth2/authorization/")
                .path(provider.name().toLowerCase(Locale.ROOT))
                .queryParam("intent", nonce)
                .build()
                .encode()
                .toUriString();
    }

    public void redirect(
            HttpServletResponse response,
            String parameter,
            String value
    ) throws IOException {
        String target = UriComponentsBuilder
                .fromUriString(properties.getFrontendUrl())
                .path("/auth/callback")
                .queryParam(parameter, value)
                .build()
                .encode()
                .toUriString();

        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        response.sendRedirect(target);
    }

    public SocialProvider provider(String value) {
        try {
            return SocialProvider.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new SocialAuthException(
                    HttpStatus.BAD_REQUEST,
                    "PROVIDER_NOT_SUPPORTED",
                    "Nhà cung cấp không được hỗ trợ."
            );
        }
    }

    private ResponseCookie cookie(String value, long maxAge) {
        return ResponseCookie.from("CHAYBOOK_TOKEN", value)
                .httpOnly(true)
                .secure(properties.isSecureCookie())
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build();
    }

    private String fingerprint(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
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