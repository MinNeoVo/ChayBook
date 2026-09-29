package com.chaybook.backend.auth.controller;


import com.chaybook.backend.auth.dto.*;
import com.chaybook.backend.auth.service.AuthService;
import com.chaybook.backend.auth.service.LoginResult;

import jakarta.validation.Valid;

import java.util.Map;

import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

// import java.util.UUID;

@CrossOrigin(origins = "http://localhost:5173",
allowCredentials = "true"
        )
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;


    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        RegisterResponse response = authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

@PostMapping(
        value = "/login",
        consumes = MediaType.APPLICATION_JSON_VALUE
)
public ResponseEntity<LoginResponse> login(
        @RequestBody LoginRequest request
) {

    if (request.getEmail() == null
            || request.getEmail().isBlank()
            || request.getPassword() == null
            || request.getPassword().isEmpty()) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Email and password are required"
        );
    }

    LoginResult result = authService.login(request);

    ResponseCookie cookie = ResponseCookie
            .from("CHAYBOOK_TOKEN", result.token())
            .httpOnly(true)
            .secure(false) // localhost HTTP
            .sameSite("Lax")
            .path("/")
            .maxAge(60 * 60)
            .build();

    return ResponseEntity
            .ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .header("Cache-Control", "no-store")
            .body(result.response());
}

@GetMapping("/me")
public ResponseEntity<MeResponse> getCurrentUser(
        Authentication authentication
) {
    return ResponseEntity.ok(
            authService.getCurrentUser(authentication)
    );
}

@PostMapping("/logout")
public ResponseEntity<Map<String, String>> logout() {

    ResponseCookie cookie = ResponseCookie.from("CHAYBOOK_TOKEN", "")
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/")
            .maxAge(0)
            .build();

    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(Map.of("message", "Logout successful"));
}
}