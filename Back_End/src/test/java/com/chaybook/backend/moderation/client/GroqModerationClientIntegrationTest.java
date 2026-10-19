package com.chaybook.backend.moderation.client;

import com.chaybook.backend.moderation.config.GroqProperties;
import com.chaybook.backend.moderation.dto.ModerationAssessment;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GroqModerationClientIntegrationTest {

    @Test
    void shouldCallGroqAndReturnModerationAssessment() {
        String apiKey = System.getenv("GROQ_API_KEY");

        assertNotNull(
                apiKey,
                "Chưa tìm thấy biến môi trường GROQ_API_KEY. Hãy khởi động lại IntelliJ/terminal sau khi cấu hình biến."
        );
        assertTrue(
                !apiKey.isBlank(),
                "Biến môi trường GROQ_API_KEY đang để trống."
        );

        String baseUrl = System.getenv()
                .getOrDefault("GROQ_BASE_URL", "https://api.groq.com/openai/v1");
        String model = System.getenv()
                .getOrDefault("GROQ_MODEL", "qwen/qwen3.8-27b");

        GroqProperties properties = new GroqProperties(baseUrl, apiKey, model);

        RestClient restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeaders(headers -> {
                    headers.setBearerAuth(apiKey);
                    headers.setContentType(MediaType.APPLICATION_JSON);
                })
                .build();

        GroqModerationClient moderationClient = new GroqModerationClient(
                restClient,
                properties,
                JsonMapper.builder().build()
        );

        ModerationAssessment assessment = moderationClient.evaluate(
                "Bài viết thử nghiệm",
                "Tôi muốn chia sẻ một công thức nấu món rau củ đơn giản."
        );

        assertNotNull(assessment, "Groq không trả về kết quả.");
        assertNotNull(assessment.result(), "Kết quả moderation bị thiếu.");
        assertNotNull(assessment.reason(), "Lý do moderation bị thiếu.");
        assertNotNull(assessment.confidence(), "Confidence bị thiếu.");
        assertTrue(
                assessment.confidence() >= 0.0 && assessment.confidence() <= 1.0,
                "Confidence phải nằm trong khoảng từ 0 đến 1."
        );

        System.out.println("Groq moderation result: " + assessment);
    }
}