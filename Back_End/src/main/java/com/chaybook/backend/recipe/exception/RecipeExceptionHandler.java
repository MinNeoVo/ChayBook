package com.chaybook.backend.recipe.exception;



import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.sql.SQLException;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(


        basePackages ={"com.chaybook.backend.recipe.controller",
        "com.chaybook.backend.admin.recipe.controller"}

)
public class RecipeExceptionHandler {
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleInvalidParameter(

            MethodArgumentTypeMismatchException exception
    ) {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Invalid value for parameter: " + exception.getName()
        );
    }


    @ExceptionHandler(RecipeException.class)
    public ProblemDetail handleRecipeException(
            RecipeException exception
    ) {
        return ProblemDetail.forStatusAndDetail(
                exception.getStatus(),
                exception.getMessage()
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDatabaseConstraint(
            DataIntegrityViolationException exception
    ) {
        Throwable cause = exception;

        while (cause != null) {
            if (cause instanceof SQLException sqlException) {
                int code = sqlException.getErrorCode();

                if (code == 547) {
                    return ProblemDetail.forStatusAndDetail(
                            HttpStatus.CONFLICT,
                            "Recipe data conflicts with related data"
                    );
                }

                if (code == 2601 || code == 2627) {
                    return ProblemDetail.forStatusAndDetail(
                            HttpStatus.CONFLICT,
                            "Duplicate recipe data or ingredient relationship"
                    );
                }
            }

            cause = cause.getCause();
        }

        return ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unable to save recipe data"
        );
    }
}
