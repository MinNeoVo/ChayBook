package com.chaybook.backend.shop.service;

import com.chaybook.backend.shop.dto.ShopGeocodeResponse;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

public class GeoapifyGeocodingService {
    private static final ParameterizedTypeReference<Map<String, Object>> RESPONSE_TYPE =
            new ParameterizedTypeReference<>() { };

    private final RestClient restClient;
    private final String apiKey;

    public GeoapifyGeocodingService(RestClient restClient, String apiKey) {
        this.restClient = restClient;
        this.apiKey = apiKey;
    }

    public ShopGeocodeResponse geocode(String address) {
        String normalizedAddress = address == null ? "" : address.strip();
        if (normalizedAddress.isBlank() || normalizedAddress.length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập địa chỉ hợp lệ (tối đa 200 ký tự).");
        }

        try {
            List<ShopGeocodeResponse> results = requestResults(normalizedAddress, false);
            if (results.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy địa chỉ này.");
            }
            return results.getFirst();
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Không thể tra cứu địa chỉ lúc này. Vui lòng thử lại."
            );
        }
    }

    public List<ShopGeocodeResponse> autocomplete(String text) {
        String normalizedText = text == null ? "" : text.strip();
        if (normalizedText.length() < 3 || normalizedText.length() > 200) {
            return List.of();
        }
        try {
            return requestResults(normalizedText, true);
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Không thể tải gợi ý địa chỉ lúc này."
            );
        }
    }

    private List<ShopGeocodeResponse> requestResults(String text, boolean autocomplete) {
        Map<String, Object> payload = restClient.get()
                .uri(builder -> builder
                        .path(autocomplete ? "/v1/geocode/autocomplete" : "/v1/geocode/search")
                        .queryParam("text", text)
                        .queryParam("format", "json")
                        .queryParam("limit", autocomplete ? 5 : 1)
                        .queryParam("lang", "vi")
                        .queryParam("countrycodes", "vn")
                        .queryParam("apiKey", apiKey)
                        .build())
                .retrieve()
                .body(RESPONSE_TYPE);

        Object resultsValue = payload == null ? null : payload.get("results");
        if (!(resultsValue instanceof List<?> results)) {
            return List.of();
        }

        List<ShopGeocodeResponse> suggestions = new ArrayList<>();
        for (Object result : results) {
            if (!(result instanceof Map<?, ?> place)) continue;
            try {
                Object formattedValue = place.get("formatted");
                String formatted = formattedValue instanceof String value ? value : text;
                suggestions.add(new ShopGeocodeResponse(
                        coordinate(place.get("lat")),
                        coordinate(place.get("lon")),
                        formatted
                ));
            } catch (ResponseStatusException ignored) {
                // Ignore malformed provider records and keep valid suggestions.
            }
        }
        return List.copyOf(suggestions);
    }

    private double coordinate(Object value) {
        if (value instanceof Number number && Double.isFinite(number.doubleValue())) {
            return number.doubleValue();
        }
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Dịch vụ địa chỉ trả tọa độ không hợp lệ.");
    }
}
