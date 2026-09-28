package com.chaybook.backend.auth.mapper;

import com.chaybook.backend.auth.dto.LoginResponse;
import com.chaybook.backend.user.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AuthUserMapper {
    public LoginResponse.UserData toResponse(User user) {
        return LoginResponse.UserData.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
