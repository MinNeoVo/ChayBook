package com.chaybook.backend.common.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(
            MethodArgumentNotValidException exception
    ) {
        Map<String, String> errors = new LinkedHashMap<>();

        exception.getBindingResult()
                .getFieldErrors()
                .forEach(error -> errors.putIfAbsent(
                        error.getField(),
                        error.getDefaultMessage()
                ));

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Dữ liệu yêu cầu không hợp lệ"
        );

        problem.setProperty("errors", errors);

        return problem;
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail handleBusinessError(
            ResponseStatusException exception
    ) {
        return ProblemDetail.forStatusAndDetail(
                exception.getStatusCode(),
                exception.getReason() == null
                        ? "Không thể xử lý yêu cầu"
                        : exception.getReason()
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

                if (code == 2601 || code == 2627) {
                    return ProblemDetail.forStatusAndDetail(
                            HttpStatus.CONFLICT,
                            "Dữ liệu đã tồn tại. Hãy kiểm tra username và email."
                    );
                }
            }

            cause = cause.getCause();
        }

        return ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Không thể lưu dữ liệu"
        );
    }
}
