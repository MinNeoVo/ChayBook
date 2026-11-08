package com.chaybook.backend.video.exception;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class VideoAnalysisException extends ResponseStatusException {
    private final String code;
    public VideoAnalysisException(HttpStatus status, String code, String message) {
        super(status, message);
        this.code = code;
    }
    public String getCode() { return code; }
}
