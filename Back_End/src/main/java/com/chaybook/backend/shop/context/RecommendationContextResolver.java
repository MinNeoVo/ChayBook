package com.chaybook.backend.shop.context;

import com.chaybook.backend.shop.dto.RecommendationSource;
import com.chaybook.backend.shop.dto.ShopRecommendationRequest;
import com.chaybook.backend.shop.model.RecommendationContext;

public interface RecommendationContextResolver {
    RecommendationSource supportedSource();

    RecommendationContext resolve(Integer userId, ShopRecommendationRequest request);
}
