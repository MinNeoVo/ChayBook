package com.chaybook.backend.user.dto;

import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.URL;

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

        @Size(max = 255, message = "Avatar URL tối đa 255 ký tự")
        @URL(message = "Avatar URL không hợp lệ")
        @Pattern(
                regexp = "^https?://\\S+$",
                message = "Avatar URL phải bắt đầu bằng http:// hoặc https://"
        )
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