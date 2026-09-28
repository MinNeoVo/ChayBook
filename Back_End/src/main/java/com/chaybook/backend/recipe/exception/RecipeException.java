package com.chaybook.backend.recipe.exception;

import org.springframework.http.HttpStatus;

public class RecipeException extends RuntimeException{
    private final HttpStatus status;

    public RecipeException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
