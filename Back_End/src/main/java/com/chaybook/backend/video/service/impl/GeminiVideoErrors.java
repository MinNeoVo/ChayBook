package com.chaybook.backend.video.service.impl;

import com.chaybook.backend.video.exception.VideoAnalysisException;
import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.ObjectMapper;

@Component
public class GeminiVideoErrors {
    private static final Logger log = LoggerFactory.getLogger(GeminiVideoErrors.class);
    private final ObjectMapper mapper;

    public GeminiVideoErrors(ObjectMapper mapper) { this.mapper = mapper; }

    public VideoAnalysisException http(RestClientResponseException failure, String operation, String model) {
        int status = failure.getStatusCode().value();
        String providerStatus = "UNKNOWN";
        String reason = "UNKNOWN";
        boolean invalidKey = false;
        try {
            var error = mapper.readTree(failure.getResponseBodyAsString()).path("error");
            providerStatus = safeToken(error.path("status").asText());
            invalidKey = error.path("message").asText().toLowerCase(Locale.ROOT)
                    .contains("api key not valid");
            for (var detail : error.path("details")) {
                if (detail.has("reason")) {
                    reason = safeToken(detail.path("reason").asText());
                    if ("API_KEY_INVALID".equals(reason)) invalidKey = true;
                }
            }
        } catch (RuntimeException ignored) { /* An HTML/empty error still has an HTTP status. */ }

        String code = invalidKey ? "AI_AUTH_FAILED" : switch (status) {
            case 400 -> "AI_PROVIDER_BAD_REQUEST";
            case 401 -> "AI_AUTH_FAILED";
            case 402 -> "AI_BILLING_REQUIRED";
            case 403 -> "AI_ACCESS_DENIED";
            case 404 -> "AI_RESOURCE_NOT_FOUND";
            case 408, 504 -> "AI_PROVIDER_TIMEOUT";
            case 429 -> "AI_QUOTA_EXCEEDED";
            case 500, 502, 503 -> "AI_PROVIDER_UNAVAILABLE";
            default -> "AI_PROVIDER_FAILED";
        };
        // Do not log headers, URLs, prompts, API keys or the raw provider response.
        log.warn("Gemini video operation={} model={} http={} status={} reason={} code={}",
                operation, model, status, providerStatus, reason, code);
        return error(code);
    }

    public VideoAnalysisException transport(ResourceAccessException failure, String operation, String model) {
        boolean timeout = false;
        Throwable cause = failure;
        for (int depth = 0; cause != null && depth < 10; depth++, cause = cause.getCause()) {
            if (cause instanceof HttpTimeoutException || cause instanceof SocketTimeoutException) timeout = true;
        }
        String code = timeout ? "AI_PROVIDER_TIMEOUT" : "AI_NETWORK_ERROR";
        log.warn("Gemini video operation={} model={} code={}", operation, model, code);
        return error(code);
    }

    private String safeToken(String value) {
        return value.matches("[A-Za-z0-9_.-]{1,100}") ? value : "UNKNOWN";
    }

    private VideoAnalysisException error(String code) {
        return new VideoAnalysisException(HttpStatus.BAD_GATEWAY, code,
                "Dịch vụ phân tích video chưa hoàn tất yêu cầu.");
    }
}
