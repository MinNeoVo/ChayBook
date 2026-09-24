package com.chaybook.backend.service;

import com.chaybook.backend.dto.Auth.LoginRequest;
import com.chaybook.backend.dto.Auth.LoginResponse;
import com.chaybook.backend.dto.Auth.RegisterRequest;
import com.chaybook.backend.dto.Auth.RegisterResponse;
import com.chaybook.backend.entity.User;
import com.chaybook.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

public LoginResponse login(LoginRequest request) {

    Optional<User> userOpt =
            userRepository.findByEmailIgnoreCase(request.getEmail());

    // Case 1: Không tìm thấy tài khoản
    if (userOpt.isEmpty()) {
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No account found with this email."
        );
    }

    User user = userOpt.get();

    // Case 2: Sai mật khẩu
    if (!passwordEncoder.matches(
            request.getPassword(),
            user.getPasswordHash()
    )) {
        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Incorrect email or password."
        );
    }

    // Case 3: Tài khoản bị disable
    if ("DISABLED".equalsIgnoreCase(user.getStatus())) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Your account has been disabled."
        );
    }

    return new LoginResponse(
            "Login successful",
            new LoginResponse.UserData(
                    user.getUserId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getRole()
            )
    );
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

        user.setRole("USER");
        user.setStatus("ACTIVE");

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
