package com.chaybook.backend.user.dto;

import jakarta.validation.constraints.*;

import java.util.Locale;

public record UpdateProfileRequest(

        @NotBlank(message = "Username không được để trống")
        @Pattern(
                regexp = "^[a-z0-9_.]{3,50}$",
                message = "Username phải có 3–50 ký tự, gồm chữ, số, _ hoặc ."
        )
        String username,

        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 255, message = "Họ tên tối đa 255 ký tự")
        String fullName,

        // avatarUrl do server tự sinh (relative path hoặc URL ngoài),
        // chỉ kiểm tra độ dài, không ép buộc format http.
        @Size(max = 255, message = "Avatar URL tối đa 255 ký tự")
        String avatarUrl
) {

    public UpdateProfileRequest {
        username = username == null
                ? null
                : username.strip().toLowerCase(Locale.ROOT);

        fullName = fullName == null
                ? null
                : fullName.strip();

        avatarUrl = avatarUrl == null || avatarUrl.isBlank()
                ? null
                : avatarUrl.strip();
    }
}