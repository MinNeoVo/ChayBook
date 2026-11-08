package com.chaybook.backend.video;

import com.chaybook.backend.video.service.impl.GeminiVideoErrors;
import java.net.SocketTimeoutException;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.ResourceAccessException;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;

class GeminiVideoErrorsTest {
    private final GeminiVideoErrors errors = new GeminiVideoErrors(new ObjectMapper());

    @ParameterizedTest
    @CsvSource({"400,AI_PROVIDER_BAD_REQUEST", "401,AI_AUTH_FAILED", "402,AI_BILLING_REQUIRED",
            "403,AI_ACCESS_DENIED", "404,AI_RESOURCE_NOT_FOUND", "429,AI_QUOTA_EXCEEDED",
            "503,AI_PROVIDER_UNAVAILABLE", "504,AI_PROVIDER_TIMEOUT"})
    void distinguishesProviderErrors(int status, String code) {
        assertEquals(code, errors.http(http(status, "{}"), "review", "test-model").getCode());
    }

    @Test void handlesInvalidKeyReportedAsBadRequest() {
        var failure = http(400, """
                {"error":{"status":"INVALID_ARGUMENT","details":[{"reason":"API_KEY_INVALID"}]}}
                """);
        assertEquals("AI_AUTH_FAILED", errors.http(failure, "review", "test-model").getCode());
    }

    @Test void handlesNonJsonErrorWithoutExposingItsBody() {
        var mapped = errors.http(http(503, "<html>secret-test-key</html>"), "review", "test-model");
        assertEquals("AI_PROVIDER_UNAVAILABLE", mapped.getCode());
        assertFalse(mapped.getMessage().contains("secret-test-key"));
    }

    @Test void distinguishesTimeoutFromNetworkError() {
        assertEquals("AI_PROVIDER_TIMEOUT", errors.transport(
                new ResourceAccessException("test", new SocketTimeoutException()), "review", "test-model").getCode());
        assertEquals("AI_NETWORK_ERROR", errors.transport(
                new ResourceAccessException("test", new IOException()), "review", "test-model").getCode());
    }

    private RestClientResponseException http(int status, String body) {
        return new RestClientResponseException("test", status, "test", new HttpHeaders(),
                body.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8);
    }
}
