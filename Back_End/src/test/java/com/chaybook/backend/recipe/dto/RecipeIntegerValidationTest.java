package com.chaybook.backend.recipe.dto;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import tools.jackson.databind.json.JsonMapper;
import static org.junit.jupiter.api.Assertions.*;

class RecipeIntegerValidationTest {
    @ParameterizedTest @ValueSource(strings={"1.5","-0.1","\"2\"","2147483648"})
    void refusesCoercionOrOverflow(String value) {
        var mapper=JsonMapper.builder().build();
        for(String field:java.util.List.of("prepTime","cookTime","servings")) {
            assertThrows(tools.jackson.core.JacksonException.class,()->mapper.readValue("{\""+field+"\":"+value+"}",RecipeWriteRequest.class));
        }
    }
}
