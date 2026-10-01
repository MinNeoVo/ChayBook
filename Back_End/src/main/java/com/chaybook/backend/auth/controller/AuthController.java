package com.chaybook.backend.auth.controller;

import com.chaybook.backend.auth.dto.*;
import com.chaybook.backend.auth.service.AuthService;
import com.chaybook.backend.auth.service.LoginResult;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final String TOKEN_COOKIE = "CHAYBOOK_TOKEN";

    private final AuthService authService;
    private final boolean cookieSecure;
    private final Duration tokenLifetime;

    public AuthController(
            AuthService authService,
            @Value("${jwt.cookie.secure:${server.servlet.session.cookie.secure:false}}") boolean cookieSecure,
            @Value("${jwt.expiration}") long expirationMillis
    ) {
        if (expirationMillis < 1000) {
            throw new IllegalArgumentException("jwt.expiration must be at least 1000 milliseconds");
        }
        this.authService = authService;
        this.cookieSecure = cookieSecure;
        this.tokenLifetime = Duration.ofMillis(expirationMillis);
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResult result = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, tokenCookie(result.token(), tokenLifetime).toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(result.response());
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> currentUser(Authentication authentication) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(authService.getCurrentUser(authentication));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        // Removing the browser cookie does not revoke other copies of this JWT.
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, tokenCookie("", Duration.ZERO).toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(Map.of("message", "Logout successful"));
    }

    private ResponseCookie tokenCookie(String value, Duration maxAge) {
        return ResponseCookie.from(TOKEN_COOKIE, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build();
    }
}
