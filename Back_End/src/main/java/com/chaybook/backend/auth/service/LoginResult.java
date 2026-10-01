package com.chaybook.backend.auth.service;

import com.chaybook.backend.auth.dto.LoginResponse;

public record LoginResult(
        LoginResponse response,
        String token
) {
}