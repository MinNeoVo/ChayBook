package com.chaybook.backend.recognition.provider.gemini;

import com.chaybook.backend.recognition.provider.ContentRecognitionProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Component
public class GeminiContentProvider implements ContentRecognitionProvider {

    private final RestClient restClient;
    private final String apiKey;
    private final String apiUrl;

    public GeminiContentProvider(
            @Value("${gemini.api.key}") String apiKey,
            @Value("${gemini.vision.api.url}") String apiUrl
    ) {
        SimpleClientHttpRequestFactory requestFactory =
                new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(120));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
    }

    @Override
    public String generateText(String prompt) {
        return callGemini(prompt, null, null, false);
    }

    @Override
    public String generateContent(
            String prompt,
            byte[] imageBytes,
            String mimeType
    ) {
        if (imageBytes == null || imageBytes.length == 0
                || mimeType == null || !mimeType.startsWith("image/")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ảnh gửi lên không hợp lệ."
            );
        }

        return callGemini(prompt, imageBytes, mimeType, true);
    }

    private String callGemini(
            String prompt,
            byte[] imageBytes,
            String mimeType,
            boolean jsonResponse
    ) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Chưa cấu hình GEMINI_API_KEY."
            );
        }

        List<Map<String, Object>> parts;

        if (imageBytes == null) {
            parts = List.of(Map.of("text", prompt));
        } else {
            parts = List.of(
                    Map.of("text", prompt),
                    Map.of(
                            "inlineData",
                            Map.of(
                                    "mimeType", mimeType,
                                    "data", Base64.getEncoder()
                                            .encodeToString(imageBytes)
                            )
                    )
            );
        }

        Map<String, Object> generationConfig = jsonResponse
                ? Map.of(
                "responseMimeType", "application/json",
                "maxOutputTokens", 512,
                "thinkingConfig", Map.of("thinkingLevel", "low")
        )
                : Map.of(
                "maxOutputTokens", 64,
                "thinkingConfig", Map.of("thinkingLevel", "low")
        );

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", parts)),
                "generationConfig", generationConfig
        );

        try {
            GeminiGenerateContentResponse response = restClient.post()
                    .uri(apiUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("x-goog-api-key", apiKey)
                    .body(requestBody)
                    .retrieve()
                    .body(GeminiGenerateContentResponse.class);

            if (response == null
                    || response.candidates() == null
                    || response.candidates().isEmpty()
                    || response.candidates().get(0).content() == null
                    || response.candidates().get(0).content().parts() == null
                    || response.candidates().get(0).content().parts().isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Gemini không trả về nội dung."
                );
            }

            String text = response.candidates()
                    .get(0)
                    .content()
                    .parts()
                    .get(0)
                    .text();

            if (text == null || text.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Gemini trả về nội dung rỗng."
                );
            }

            return text.trim();

        } catch (RestClientResponseException exception) {
            System.err.println("Gemini HTTP status: "
                    + exception.getStatusCode().value());
            System.err.println("Gemini response body: "
                    + exception.getResponseBodyAsString());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Gemini từ chối xử lý yêu cầu.",
                    exception
            );
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.GATEWAY_TIMEOUT,
                    "Gemini phản hồi quá lâu hoặc không thể kết nối.",
                    exception
            );
        }
    }
}