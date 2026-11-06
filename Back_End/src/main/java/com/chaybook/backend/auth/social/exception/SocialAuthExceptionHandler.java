package com.chaybook.backend.auth.social.exception;

import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(
        basePackages = "com.chaybook.backend.auth.social"
)
public class SocialAuthExceptionHandler {

    @ExceptionHandler(SocialAuthException.class)
    public ProblemDetail handleSocialAuth(
            SocialAuthException exception
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                exception.getStatus(),
                exception.getMessage()
        );

        problem.setProperty("code", exception.getCode());

        return problem;
    }
}