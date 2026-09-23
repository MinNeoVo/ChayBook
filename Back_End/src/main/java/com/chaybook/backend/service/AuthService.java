package com.chaybook.backend.service;

import com.chaybook.backend.dto.Auth.LoginRequest;
import com.chaybook.backend.entity.User;
import com.chaybook.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

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
}