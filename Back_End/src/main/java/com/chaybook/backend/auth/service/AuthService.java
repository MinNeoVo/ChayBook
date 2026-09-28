package com.chaybook.backend.auth.service;

import com.chaybook.backend.auth.dto.*;
import com.chaybook.backend.auth.mapper.AuthUserMapper;
import com.chaybook.backend.user.repository.UserRepository;
import com.chaybook.backend.user.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthUserMapper authUserMapper;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthUserMapper authUserMapper
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authUserMapper = authUserMapper;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No account found with this email."
                ));

        if (request.getPassword().getBytes(StandardCharsets.UTF_8).length > 72
                || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Incorrect email or password."
            );
        }
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "DISABLED".equalsIgnoreCase(user.getStatus())
                            ? "Your account has been disabled."
                            : "Your account is not active."
            );
        }
        return LoginResponse.builder()
                .message("Login successful")
                .user(authUserMapper.toResponse(user))
                .build();
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {

        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mật khẩu không được vượt quá 72 ký tự"
            );
        }

        if (userRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Username đã được sử dụng"
            );
        }

        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email đã được sử dụng"
            );
        }

        User user = new User();

        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setFullName(request.fullName());

        user.setPasswordHash(
                passwordEncoder.encode(request.password())
        );



        User savedUser = userRepository.saveAndFlush(user);

        return new RegisterResponse(
                "Register successful",
                new RegisterResponse.UserData(
                        savedUser.getUserId(),
                        savedUser.getUsername(),
                        savedUser.getEmail(),
                        savedUser.getFullName(),
                        savedUser.getRole()
                )
        );
    }
}
