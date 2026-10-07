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
            GeminiRequest.Part part = new GeminiRequest.Part(promptText);
            GeminiRequest.Content content = new GeminiRequest.Content(Collections.singletonList(part));
            GeminiRequest request = new GeminiRequest(Collections.singletonList(content));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<GeminiRequest> entity = new HttpEntity<>(request, headers);
            String urlWithKey = apiUrl + "?key=" + apiKey;

            GeminiResponse response = restTemplate.postForObject(urlWithKey, entity, GeminiResponse.class);

            if (response == null || response.getCandidates() == null || response.getCandidates().isEmpty()) {
                throw new RuntimeException("Lỗi: Không nhận được phản hồi từ Gemini API.");
            }

            List<GeminiRequest.Part> parts = response.getCandidates().get(0).getContent().getParts();
            return parts.get(0).getText();

        } catch (Exception e) {
            System.err.println("========== LỖI TẠI GEMINI CLIENT ==========");
            e.printStackTrace();
            System.err.println("===========================================");
            throw new RuntimeException("Lỗi khi gọi Gemini API: " + e.getMessage());
        }
    }
}