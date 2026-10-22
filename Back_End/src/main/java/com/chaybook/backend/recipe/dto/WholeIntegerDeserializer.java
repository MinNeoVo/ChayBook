package com.chaybook.backend.recipe.dto;

import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.ValueDeserializer;

/** Reject fractions instead of silently truncating recipe times/servings. */
public class WholeIntegerDeserializer extends ValueDeserializer<Integer> {
    @Override public Integer deserialize(JsonParser parser, DeserializationContext context) {
        if (!parser.hasToken(JsonToken.VALUE_NUMBER_INT))
            return context.reportInputMismatch(Integer.class, "A whole integer is required");
        return parser.getIntValue();
    }
}
