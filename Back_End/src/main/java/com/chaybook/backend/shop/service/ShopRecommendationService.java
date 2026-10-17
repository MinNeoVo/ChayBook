package com.chaybook.backend.shop.service;

import com.chaybook.backend.shop.dto.ShopRecommendationRequest;
import com.chaybook.backend.shop.dto.ShopRecommendationResponse;

public interface ShopRecommendationService {
    ShopRecommendationResponse recommend(Integer userId, ShopRecommendationRequest request);
}
