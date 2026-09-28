package com.chaybook.backend.ingredient.exception;

import org.springframework.http.HttpStatus;

public class IngredientException extends RuntimeException{
    private final HttpStatus status;

    public IngredientException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
