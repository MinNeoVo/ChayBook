package com.chaybook.backend.community.exception;

import com.chaybook.backend.community.controller.CommentController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = CommentController.class)
public class CommentExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(CommentExceptionHandler.class);

    @ExceptionHandler(CommentException.class)
    public ProblemDetail handleBusiness(CommentException exception) {
        return problem(
                exception.getStatus(),
                exception.getCode(),
                exception.getMessage()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(
            MethodArgumentNotValidException exception
    ) {
        Map<String, String> errors = new LinkedHashMap<>();

        exception.getBindingResult().getFieldErrors()
                .forEach(fieldError -> errors.putIfAbsent(
                        fieldError.getField(),
                        fieldError.getDefaultMessage()
                ));

        ProblemDetail problem = problem(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_FAILED",
                "Dữ liệu không hợp lệ"
        );

        problem.setProperty("errors", errors);

        return problem;
    }

    @ExceptionHandler({
            MethodArgumentTypeMismatchException.class,
            HttpMessageNotReadableException.class
    })
    public ProblemDetail handleInvalidRequest(Exception exception) {
        return problem(
                HttpStatus.BAD_REQUEST,
                "INVALID_REQUEST",
                "Định dạng ID, tham số hoặc JSON không hợp lệ"
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataConflict(
            DataIntegrityViolationException exception
    ) {
        log.error("Comment data constraint violation", exception);

        return problem(
                HttpStatus.CONFLICT,
                "DATA_CONFLICT",
                "Dữ liệu liên quan đã thay đổi. Vui lòng tải lại"
        );
    }

    @ExceptionHandler(ConcurrencyFailureException.class)
    public ProblemDetail handleConcurrentChange(
            ConcurrencyFailureException exception
    ) {
        log.warn("Concurrent comment operation", exception);

        return problem(
                HttpStatus.CONFLICT,
                "CONCURRENT_CHANGE",
                "Dữ liệu đang được thay đổi. Vui lòng thử lại"
        );
    }

    private ProblemDetail problem(
            HttpStatus status,
            String code,
            String detail
    ) {
        ProblemDetail problem =
                ProblemDetail.forStatusAndDetail(status, detail);

        problem.setProperty("code", code);

        return problem;
    }
}