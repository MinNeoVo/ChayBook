package com.chaybook.backend.auth.controller;


import com.chaybook.backend.auth.dto.LoginRequest;
import com.chaybook.backend.auth.dto.LoginResponse;
import com.chaybook.backend.auth.dto.RegisterRequest;
import com.chaybook.backend.auth.dto.RegisterResponse;
import com.chaybook.backend.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

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

@PostMapping(value = "/login",
        consumes = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<LoginResponse> login(
        @RequestBody LoginRequest request,   HttpServletRequest httpRequest
)
{
    if (request.getEmail() == null
            || request.getEmail().isBlank()
            || request.getPassword() == null
            || request.getPassword().isEmpty()) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Email and password are required"
        );
    }

    LoginResponse response = authService.login(request);

    HttpSession session = httpRequest.getSession(true);

    httpRequest.changeSessionId();

    session.setAttribute(
            "AUTH_USER_ID",
            response.user().userId()
    );

    session.setMaxInactiveInterval(30 * 60);

    return ResponseEntity.ok()
            .header("Cache-Control", "no-store")
            .body(response);
}
}