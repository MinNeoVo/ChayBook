package com.chaybook.backend.moderation.speech.groq;

import com.chaybook.backend.moderation.config.GroqProperties;
import com.chaybook.backend.moderation.speech.SpeechToTextProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class GroqWhisperProvider implements SpeechToTextProvider {

    private final RestClient restClient;
    private final String model;

    public GroqWhisperProvider(
            @Qualifier("groqRestClient") RestClient restClient,
            @Value("${groq.whisper-model:whisper-large-v3-turbo}")
            String model
    ) {
        this.restClient = restClient;
        this.model = model;
    }

    @Override
    @SuppressWarnings("unchecked")
    public String transcribe(byte[] audioBytes) {
        if (audioBytes == null || audioBytes.length == 0) {
            throw new IllegalArgumentException("Audio không được để trống.");
        }

        ByteArrayResource audioResource = new ByteArrayResource(audioBytes) {
            @Override
            public String getFilename() {
                return "post-audio.wav";
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", audioResource);
        body.add("model", model);
        body.add("language", "vi");
        body.add("response_format", "json");
        body.add("temperature", "0");

        Map<String, Object> response = restClient.post()
                .uri("/audio/transcriptions")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(Map.class);

        if (response == null || response.get("text") == null) {
            throw new IllegalStateException("Whisper trả về transcript rỗng.");
        }

        return response.get("text").toString().strip();
    }
}