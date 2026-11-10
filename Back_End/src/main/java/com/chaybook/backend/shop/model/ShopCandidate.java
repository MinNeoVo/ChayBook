package com.chaybook.backend.shop.model;

import com.chaybook.backend.shop.dto.DietaryMode;
import com.chaybook.backend.shop.dto.ShopAttribution;

import java.util.List;
import java.util.Set;

public record ShopCandidate(
        String placeId,
        String name,
        String address,
        Double latitude,
        Double longitude,
        Set<DietaryMode> dietaryModes,
        String businessStatus,
        String dietaryEvidence,
        String mapUrl,
        List<ShopAttribution> attributions
) {
    public ShopCandidate {
        dietaryModes = dietaryModes == null
                ? Set.of()
                : Set.copyOf(dietaryModes);

        attributions = attributions == null
                ? List.of()
                : List.copyOf(attributions);
    }
}