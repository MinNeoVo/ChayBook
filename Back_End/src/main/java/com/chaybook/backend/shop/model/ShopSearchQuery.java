package com.chaybook.backend.shop.model;

import com.chaybook.backend.shop.dto.DietaryMode;

public record ShopSearchQuery(
        String textQuery,
        double latitude,
        double longitude,
        int radiusMeters,
        DietaryMode dietaryMode,
        int candidateLimit
) {
}
