package com.chaybook.backend.recognition.provider.gemini;

import com.chaybook.backend.recognition.provider.ContentRecognitionProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

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

        this.restClient = RestClient.create();
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
    }

    @Override
    public String generateText(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Chưa cấu hình GEMINI_API_KEY."
            );
        }

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", prompt)
                                )
                        )
                ),
                "generationConfig", Map.of(
                        "temperature", 0.0,
                        "maxOutputTokens", 64
                )
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
            exception.printStackTrace();

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Không gọi được Gemini 3.8 Flash. Hãy kiểm tra API key, model và hạn mức.",
                    exception
            );
        } catch (RestClientException exception) {
            exception.printStackTrace();
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Không kết nối được tới Gemini.",
                    exception
            );
        }
    }
}