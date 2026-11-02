package com.chaybook.backend.shop.dto;

public record ShopGeocodeResponse(
        double latitude,
        double longitude,
        String formattedAddress
) {
}
