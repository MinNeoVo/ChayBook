package com.chaybook.backend.moderation.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(GroqProperties.class)
public class GroqConfiguration {

    @Bean
    public RestClient groqRestClient(GroqProperties properties) {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            throw new IllegalStateException(
                    "Missing GROQ_API_KEY environment variable"
            );
        }

        return RestClient.builder()
                .baseUrl(properties.baseUrl())
                .defaultHeaders(headers -> {
                    headers.setBearerAuth(properties.apiKey());
                    headers.setContentType(MediaType.APPLICATION_JSON);
                })
                .build();
    }
}