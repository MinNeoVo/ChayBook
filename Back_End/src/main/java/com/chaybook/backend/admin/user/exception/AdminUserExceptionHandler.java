package com.chaybook.backend.admin.user.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(
        basePackages = "com.chaybook.backend.admin.user.controller"
)
public class AdminUserExceptionHandler {
    private static final Logger log =
            LoggerFactory.getLogger(AdminUserExceptionHandler.class);

    @ExceptionHandler(AdminUserException.class)
    public ProblemDetail handleAdminUserException(
            AdminUserException exception
    ) {
        log.warn(
                "Admin user request rejected: {}",
                exception.getMessage(),
                exception
        );

        return ProblemDetail.forStatusAndDetail(
                exception.getStatus(),
                exception.getMessage()
        );
    }

    @ExceptionHandler(DataAccessException.class)
    public ProblemDetail handleDatabaseException(
            DataAccessException exception
    ) {
        log.error(
                "Database error while processing admin user request",
                exception
        );

        return ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unable to process user data"
        );
    }
}
