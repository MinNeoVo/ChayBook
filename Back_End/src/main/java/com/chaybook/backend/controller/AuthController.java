package com.chaybook.backend.controller;

import com.chaybook.backend.dto.Auth.LoginRequest;
import com.chaybook.backend.dto.Auth.RegisterRequest;
import com.chaybook.backend.dto.Auth.RegisterResponse;
import com.chaybook.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        String result = authService.login(request);

        if (result.equals("Đăng nhập thành công!")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }
}