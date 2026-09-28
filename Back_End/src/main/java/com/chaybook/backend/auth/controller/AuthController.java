package com.chaybook.backend.auth.controller;

import com.chaybook.backend.auth.dto.*;
import com.chaybook.backend.auth.service.AuthService;
import com.chaybook.backend.auth.mapper.AuthUserMapper;
import com.chaybook.backend.auth.service.CurrentUserProvider;
import com.chaybook.backend.auth.service.SessionAuthenticationService;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final SessionAuthenticationService sessionAuthenticationService;
    private final CurrentUserProvider currentUserProvider;
    private final AuthUserMapper authUserMapper;

    public AuthController(
            AuthService authService,
            SessionAuthenticationService sessionAuthenticationService,
            CurrentUserProvider currentUserProvider,
            AuthUserMapper authUserMapper
    ) {
        this.authService = authService;
        this.sessionAuthenticationService = sessionAuthenticationService;
        this.currentUserProvider = currentUserProvider;
        this.authUserMapper = authUserMapper;
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
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        LoginResponse response = authService.login(request);
        sessionAuthenticationService.signIn(response.user(), httpRequest, httpResponse);

        return ResponseEntity.ok()
                .header("Cache-Control", "no-store")
                .body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<LoginResponse.UserData> currentUser() {
        return ResponseEntity.ok()
                .header("Cache-Control", "no-store")
                .body(authUserMapper.toResponse(currentUserProvider.requireUser()));
    }
}
