package com.chaybook.backend.shop.controller;

import com.chaybook.backend.shop.dto.ShopRecommendationRequest;
import com.chaybook.backend.shop.dto.ShopRecommendationResponse;
import com.chaybook.backend.shop.service.ShopRecommendationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/shops")
public class ShopController {
    private final ShopRecommendationService recommendationService;

    public ShopController(ShopRecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @PostMapping("/recommendations")
    public ShopRecommendationResponse recommend(
            @Valid @RequestBody ShopRecommendationRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return recommendationService.recommend(authenticatedUserId(jwt), request);
    }

    private Integer authenticatedUserId(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        try {
            Integer userId = Integer.valueOf(jwt.getSubject());
            if (userId <= 0) {
                throw new NumberFormatException("User ID must be positive");
            }
            return userId;
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Thông tin đăng nhập không hợp lệ.", exception
            );
        }
    }
}
