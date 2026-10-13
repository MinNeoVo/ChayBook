package com.chaybook.backend.community.exception;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.chaybook.backend.community.controller.PostController;
import com.chaybook.backend.community.controller.PostInteractionController;

import java.sql.SQLException;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = {
        PostController.class,
        PostInteractionController.class
})
public class PostExceptionHandler {
    @ExceptionHandler(PostException.class)
    public ProblemDetail handlePostException(PostException exception) {
        return ProblemDetail.forStatusAndDetail(
                exception.getStatus(),
                exception.getMessage()
        );
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleInvalidParameter(
            MethodArgumentTypeMismatchException exception
    ) {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Invalid value for parameter: " + exception.getName()
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handlePostDatabaseConstraint(
            DataIntegrityViolationException exception
    ) {
        Throwable cause = exception;

        while (cause != null) {
            if (cause instanceof SQLException sqlException) {
                int code = sqlException.getErrorCode();

                if (code == 547) {
                    return ProblemDetail.forStatusAndDetail(
                            HttpStatus.CONFLICT,
                            "Post data conflicts with related data. "
                                    + "Please check the user and category"
                    );
                }

                if (code == 2601 || code == 2627) {
                    return ProblemDetail.forStatusAndDetail(
                            HttpStatus.CONFLICT,
                            "Post data conflicts with an existing record"
                    );
                }
            }

            cause = cause.getCause();
        }

        return ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unable to save post"
        );
    }
}
