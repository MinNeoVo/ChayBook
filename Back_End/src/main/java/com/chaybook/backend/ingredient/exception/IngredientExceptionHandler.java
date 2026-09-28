package com.chaybook.backend.ingredient.exception;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.*;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(
        basePackages = "com.chaybook.backend.ingredient.controller"
)
public class IngredientExceptionHandler {
    @ExceptionHandler(IngredientException.class)
    public ProblemDetail handleIngredientException(
            IngredientException exception
    ) {
        return ProblemDetail.forStatusAndDetail(
                exception.getStatus(),
                exception.getMessage()
        );
    }
}
