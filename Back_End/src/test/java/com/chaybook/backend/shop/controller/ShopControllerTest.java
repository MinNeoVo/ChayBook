package com.chaybook.backend.shop.controller;

import com.chaybook.backend.common.exception.GlobalExceptionHandler;
import com.chaybook.backend.shop.dto.ShopRecommendationRequest;
import com.chaybook.backend.shop.dto.ShopRecommendationResponse;
import com.chaybook.backend.shop.service.ShopRecommendationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ShopControllerTest {
    private static final String SEARCH_BODY = """
            {
              "source": "SEARCH", "query": "phở chay",
              "latitude": 10.7769, "longitude": 106.7009,
              "radiusMeters": 5000, "dietaryMode": "VEGETARIAN", "limit": 10
            }
            """;

    private ShopRecommendationService service;
    private LocalValidatorFactoryBean validator;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        service = mock(ShopRecommendationService.class);
        validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mvc = MockMvcBuilders.standaloneSetup(new ShopController(service))
                .setControllerAdvice(new ShopExceptionHandler(), new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setValidator(validator)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        validator.close();
    }

    @Test
    void validRequestUsesJwtSubjectAndReturnsResponseContract() throws Exception {
        authenticate();
        when(service.recommend(eq(27), any(ShopRecommendationRequest.class)))
                .thenReturn(new ShopRecommendationResponse(List.of(), false));

        mvc.perform(post("/api/shops/recommendations")
                        .contentType(MediaType.APPLICATION_JSON).content(SEARCH_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.fallbackUsed").value(false));

        verify(service).recommend(eq(27), any(ShopRecommendationRequest.class));
    }

    @Test
    void missingIdentityReturnsUnauthorizedWithoutCallingService() throws Exception {
        mvc.perform(post("/api/shops/recommendations")
                        .contentType(MediaType.APPLICATION_JSON).content(SEARCH_BODY))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }

    @Test
    void invalidSourcePayloadIsRejectedBeforeService() throws Exception {
        authenticate();
        String body = SEARCH_BODY.replace("\"query\": \"phở chay\"", "\"query\": \"   \"");
        mvc.perform(post("/api/shops/recommendations")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.contextValid").exists());
        verifyNoInteractions(service);
    }

    @Test
    void unknownSourceReturnsBadRequestProblemDetail() throws Exception {
        authenticate();
        mvc.perform(post("/api/shops/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SEARCH_BODY.replace("SEARCH", "UNKNOWN")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    @Test
    void unavailableProviderRemainsServiceUnavailable() throws Exception {
        authenticate();
        when(service.recommend(eq(27), any(ShopRecommendationRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Chức năng tìm quán chưa sẵn sàng."));
        mvc.perform(post("/api/shops/recommendations")
                        .contentType(MediaType.APPLICATION_JSON).content(SEARCH_BODY))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503));
    }

    private void authenticate() {
        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "HS256")
                .subject("27")
                .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }
}
