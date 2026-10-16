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
        authService.startRegistration(request);
        return ResponseEntity.accepted().body(new RegisterResponse(
                "Mã OTP đã được gửi đến email. Nhập mã trong vòng 10 phút để hoàn tất đăng ký.", null));
    }

    @PostMapping("/register/verify")
    public ResponseEntity<RegisterResponse> verifyRegistration(
            @Valid @RequestBody VerifyRegistrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.verifyRegistration(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request.email());
        return ResponseEntity.ok(Map.of("message", "Nếu email có tài khoản, mã OTP sẽ được gửi đến hộp thư."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Mật khẩu đã được cập nhật."));
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
