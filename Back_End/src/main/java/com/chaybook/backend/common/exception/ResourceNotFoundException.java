package com.chaybook.backend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class ResourceNotFoundException extends ResponseStatusException {
    public ResourceNotFoundException(String resource, Integer id) {
        super(HttpStatus.NOT_FOUND, resource + " not found with id: " + id);
    }
}
