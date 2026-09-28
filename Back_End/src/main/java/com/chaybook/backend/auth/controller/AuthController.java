package com.chaybook.backend.auth.controller;


import com.chaybook.backend.auth.dto.*;
import com.chaybook.backend.auth.service.AuthService;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import org.springframework.http.*;
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

    LoginResponse response = authService.login(request);

    return ResponseEntity
            .ok()
            .header("Cache-Control", "no-store")
            .body(response);
}
}