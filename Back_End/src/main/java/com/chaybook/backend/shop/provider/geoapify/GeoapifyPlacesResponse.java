package com.chaybook.backend.shop.provider.geoapify;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GeoapifyPlacesResponse(
        String type,
        List<Feature> features
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Feature(
            Properties properties
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Properties(
            @JsonProperty("place_id")
            String placeId,

            String name,
            String formatted,
            Double lat,
            Double lon,
            List<String> categories
    ) {
    }
}