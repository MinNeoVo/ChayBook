package com.chaybook.backend.admin.ingredient.exception;

import com.chaybook.backend.admin.ingredient.controller.AdminIngredientController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.sql.SQLException;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(
        basePackageClasses = AdminIngredientController.class
)
public class AdminIngredientExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(AdminIngredientExceptionHandler.class);

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleInvalidParameter(
            MethodArgumentTypeMismatchException exception
    ) {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Invalid parameter: " + exception.getName()
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDatabaseConstraint(
            DataIntegrityViolationException exception
    ) {
        Throwable cause = exception;

        while (cause != null) {
            if (cause instanceof SQLException sqlException) {
                int errorCode = sqlException.getErrorCode();

                if (errorCode == 2601 || errorCode == 2627) {
                    return ProblemDetail.forStatusAndDetail(
                            HttpStatus.CONFLICT,
                            "An ingredient with this name already exists"
                    );
                }

                if (errorCode == 547) {
                    return ProblemDetail.forStatusAndDetail(
                            HttpStatus.CONFLICT,
                            "This ingredient is linked to other data. The operation cannot be completed"
                    );
                }
            }

            cause = cause.getCause();
        }

        log.error("Unable to update data", exception);

        return ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unable to update the ingredient. Please try again later!s"
        );
    }
}