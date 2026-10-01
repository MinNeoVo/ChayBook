package com.chaybook.backend.auth.service;

import com.chaybook.backend.auth.dto.*;
import com.chaybook.backend.auth.mapper.AuthUserMapper;
import com.chaybook.backend.security.JwtService;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthUserMapper authUserMapper;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthUserMapper authUserMapper, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authUserMapper = authUserMapper;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResult login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No account found with this email."));

        if (request.getPassword().getBytes(StandardCharsets.UTF_8).length > 72
                || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect email or password.");
        }
        requireActive(user);

        LoginResponse response = LoginResponse.builder()
                .message("Login successful")
                .user(authUserMapper.toResponse(user))
                .build();
        String token = jwtService.generateToken(
                user.getUserId(), user.getEmail(), user.getRole().toUpperCase(Locale.ROOT));
        return new LoginResult(response, token);
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Mật khẩu không được vượt quá 72 byte UTF-8");
        }
        if (userRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username đã được sử dụng");
        }
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được sử dụng");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setFullName(request.fullName());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        User savedUser = userRepository.saveAndFlush(user);

        return new RegisterResponse("Register successful", new RegisterResponse.UserData(
                savedUser.getUserId(), savedUser.getUsername(), savedUser.getEmail(),
                savedUser.getFullName(), savedUser.getRole()));
    }

    @Transactional(readOnly = true)
    public MeResponse getCurrentUser(Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication)
                || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in");
        }

        Integer userId;
        try {
            userId = Integer.valueOf(jwtAuthentication.getToken().getSubject());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token subject");
        }
        if (userId <= 0) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token subject");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Account no longer exists"));
        requireActive(user);

        return new MeResponse(user.getUserId(), user.getUsername(), user.getEmail(),
                user.getFullName(), user.getAvatarUrl(), user.getRole());
    }

    private void requireActive(User user) {
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "DISABLED".equalsIgnoreCase(user.getStatus())
                            ? "Your account has been disabled."
                            : "Your account is not active.");
        }
    }
}
