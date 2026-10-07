package com.chaybook.backend.assistant.client;

import com.chaybook.backend.assistant.dto.GeminiRequest;
import com.chaybook.backend.assistant.dto.GeminiResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Component
public class GeminiClient {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateContent(String promptText) {

        try {

            // ==========================================
            // 1. Tạo request body
            // ==========================================

            GeminiRequest.Part part =
                    new GeminiRequest.Part(promptText);

            GeminiRequest.Content content =
                    new GeminiRequest.Content(
                            Collections.singletonList(part)
                    );

            GeminiRequest request =
                    new GeminiRequest(
                            Collections.singletonList(content)
                    );

            // ==========================================
            // 2. Tạo HTTP headers
            // ==========================================

            HttpHeaders headers = new HttpHeaders();

            headers.setContentType(MediaType.APPLICATION_JSON);

            // Google AI Studio dùng header này
            headers.set("X-goog-api-key", apiKey);

            // ==========================================
            // 3. Tạo HTTP request
            // ==========================================

            HttpEntity<GeminiRequest> entity =
                    new HttpEntity<>(request, headers);

            // ==========================================
            // 4. Gọi Gemini API
            // ==========================================

            GeminiResponse response =
                    restTemplate.postForObject(
                            apiUrl,
                            entity,
                            GeminiResponse.class
                    );

            // ==========================================
            // 5. Kiểm tra response
            // ==========================================

            if (response == null
                    || response.getCandidates() == null
                    || response.getCandidates().isEmpty()) {

                throw new RuntimeException(
                        "Gemini không trả về candidate."
                );
            }

            List<GeminiRequest.Part> parts =
                    response.getCandidates()
                            .get(0)
                            .getContent()
                            .getParts();

            if (parts == null || parts.isEmpty()) {

                throw new RuntimeException(
                        "Gemini không trả về nội dung."
                );
            }

            String text = parts.get(0).getText();

            if (text == null || text.isBlank()) {

                throw new RuntimeException(
                        "Gemini trả về nội dung rỗng."
                );
            }

            return text;

        } catch (Exception e) {

            System.err.println(
                    "========== LỖI TẠI GEMINI CLIENT =========="
            );

            e.printStackTrace();

            System.err.println(
                    "==========================================="
            );

            throw new RuntimeException(
                    "Lỗi khi gọi Gemini API: " + e.getMessage(),
                    e
            );
        }
    }
}