package com.chaybook.backend.shop.dto;

import java.util.List;

public record ShopResponse(
        String placeId,
        String name,
        String address,
        double latitude,
        double longitude,
        long distanceMeters,
        String reason,
        String dishAvailability,
        String dietaryEvidence,
        String mapUrl,
        List<ShopAttribution> attributions
) {
    public ShopResponse {
        attributions = attributions == null ? List.of() : List.copyOf(attributions);
    }
}
