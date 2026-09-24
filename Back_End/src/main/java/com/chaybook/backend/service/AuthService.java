package com.chaybook.backend.service;

import com.chaybook.backend.dto.Auth.LoginRequest;
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

    public String login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isEmpty()) {
            return "Sai tài khoản đăng nhập!";
        }

        User user = userOpt.get();

        // Lưu ý: Hiện tại đang so sánh mật khẩu chữ thô để dễ test.
        if (!user.getPasswordHash().equals(request.getPassword())) {
            return "Sai mật khẩu!";
        }

        if ("Banned".equalsIgnoreCase(user.getStatus())) {
            return "Tài khoản của bạn đã bị khóa!";
        }

        return "Đăng nhập thành công!";
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
