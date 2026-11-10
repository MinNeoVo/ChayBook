package com.chaybook.backend.shop.controller;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = ShopController.class)
public class ShopExceptionHandler {
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleInvalidBody(HttpMessageNotReadableException exception) {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "JSON không hợp lệ hoặc giá trị source, mealType, dietaryMode không được hỗ trợ."
        );
    }
}
