package com.chaybook.backend.admin.user.exception;

import org.springframework.http.HttpStatus;

public class AdminUserException extends RuntimeException {

    private final HttpStatus status;

    public AdminUserException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
