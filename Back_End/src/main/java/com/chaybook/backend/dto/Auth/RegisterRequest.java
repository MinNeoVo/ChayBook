package com.chaybook.backend.dto.Auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Locale;

public record RegisterRequest(

        @NotBlank(message = "Username không được để trống")
        @Pattern(
                regexp = "^[a-z0-9_.]{3,50}$",
                message = "Username phải có 3–50 ký tự, gồm chữ, số, _ hoặc ."
        )
        String username,

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        @Size(max = 255, message = "Email tối đa 255 ký tự")
        String email,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(
                min = 8,
                max = 72,
                message = "Mật khẩu phải có 8–72 ký tự"
        )
        String password,

        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 255, message = "Họ tên tối đa 255 ký tự")
        String fullName
) {

    public RegisterRequest {
        username = username == null
                ? null
                : username.strip().toLowerCase(Locale.ROOT);

        email = email == null
                ? null
                : email.strip().toLowerCase(Locale.ROOT);

        fullName = fullName == null ? null : fullName.strip();
    }
}