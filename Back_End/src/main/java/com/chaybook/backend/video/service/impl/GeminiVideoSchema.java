package com.chaybook.backend.video.service.impl;

import com.chaybook.backend.video.dto.VideoWork;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class GeminiVideoSchema {

    private GeminiVideoSchema() {
    }

    public static Map<String, Object> forOperation(
            String operation,
            VideoWork work
    ) {
        // Timestamp dùng số nguyên giây nên lấy phần nguyên thời lượng.
        long maximumSecond = work.source()
                .durationSeconds()
                .longValue();

        Map<String, Object> seconds = Map.of(
                "type", "integer",
                "minimum", 0,
                "maximum", maximumSecond
        );

        Map<String, Object> evidence = object(Map.of(
                "startSecond", seconds,
                "endSecond", seconds,
                "description", text()
        ));

        Map<String, Object> check = object(Map.of(
                "answer", Map.of(
                        "type", "string",
                        "enum", List.of("YES", "NO", "UNKNOWN")
                ),
                "reason", text(),
                "evidence", array(evidence)
        ));

        Map<String, Object> recipePresence = Map.of(
                "type", "string",
                "enum", List.of(
                        "NONE",
                        "MENTION_ONLY",
                        "PRESENT",
                        "UNKNOWN"
                )
        );

        if ("review".equals(operation)) {
            return object(Map.of(
                    "foodTopic", check,
                    "vegetarianFood", check,
                    "recipePresence", recipePresence,
                    "recipeEvidence", array(evidence)
            ));
        }

        if ("extract".equals(operation)) {
            Map<String, Object> ingredient = object(Map.of(
                    "detectedName", text(),
                    "amountText", nullable(text(), "string")
            ));

            Map<String, Object> recipe = object(Map.of(
                    "name", nullable(text(), "string"),
                    "ingredients", array(ingredient),
                    "steps", array(text())
            ));

            return object(Map.of(
                    "vegetarianFood", check,
                    "recipePresence", recipePresence,
                    "summary", nullable(text(), "string"),
                    "recipeHighlights", array(evidence),
                    "recipe", nullable(recipe, "object"),
                    "missingFields", array(text()),
                    "warnings", array(text())
            ));
        }

        throw new IllegalArgumentException(
                "Unsupported video operation: " + operation
        );
    }

    private static Map<String, Object> text() {
        return Map.of("type", "string");
    }

    private static Map<String, Object> array(
            Map<String, Object> items
    ) {
        return Map.of(
                "type", "array",
                "items", items
        );
    }

    private static Map<String, Object> object(
            Map<String, Object> properties
    ) {
        return Map.of(
                "type", "object",
                "properties", properties,
                "required", new ArrayList<>(properties.keySet())
        );
    }

    private static Map<String, Object> nullable(
            Map<String, Object> schema,
            String type
    ) {
        Map<String, Object> result = new LinkedHashMap<>(schema);
        result.put("type", List.of(type, "null"));
        return result;
    }
}