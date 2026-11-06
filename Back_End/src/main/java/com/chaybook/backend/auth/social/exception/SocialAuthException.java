package com.chaybook.backend.auth.social.exception;

import org.springframework.http.HttpStatus;

public class SocialAuthException extends RuntimeException {
    private final HttpStatus status;
    private final String code;

    public SocialAuthException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public SocialAuthException(HttpStatus status, String code, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }
}
