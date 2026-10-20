package com.chaybook.backend.shop.context;

import com.chaybook.backend.shop.dto.RecommendationSource;
import com.chaybook.backend.shop.dto.ShopRecommendationRequest;
import com.chaybook.backend.shop.model.RecommendationContext;
import org.springframework.stereotype.Component;

@Component
public class SearchContextResolver implements RecommendationContextResolver {
    @Override
    public RecommendationSource supportedSource() {
        return RecommendationSource.SEARCH;
    }

    @Override
    public RecommendationContext resolve(Integer userId, ShopRecommendationRequest request) {
        String query = request.query().strip().replaceAll("(?U)\\s+", " ");
        return new RecommendationContext(query, null);
    }
}
