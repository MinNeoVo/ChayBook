package com.chaybook.backend.shop.dto;

import java.util.List;

public record ShopRecommendationResponse(List<ShopResponse> items, boolean fallbackUsed) {
    public ShopRecommendationResponse {
        items = List.copyOf(items);
    }
}
