package com.chaybook.backend.moderation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

public record GroqChatRequest(
        String model,
        List<Message> messages,

        @JsonProperty("response_format")
        ResponseFormat responseFormat
) {
    public record Message(
            String role,
            Object content
    ) {
    }

    public record ResponseFormat(
            String type,

            @JsonProperty("json_schema")
            JsonSchema jsonSchema
    ) {
    }

    public record JsonSchema(
            String name,
            boolean strict,
            Map<String, Object> schema
    ) {
    }
}