package com.chaybook.backend.shop.provider.geoapify;

import com.chaybook.backend.shop.dto.DietaryMode;
import com.chaybook.backend.shop.dto.ShopAttribution;
import com.chaybook.backend.shop.model.ShopCandidate;
import com.chaybook.backend.shop.model.ShopSearchQuery;
import com.chaybook.backend.shop.provider.ShopSearchProvider;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;

public class GeoapifyPlacesSearchProvider implements ShopSearchProvider {

    private static final List<ShopAttribution> ATTRIBUTIONS = List.of(
            new ShopAttribution(
                    "Powered by Geoapify",
                    "https://www.geoapify.com/"
            ),
            new ShopAttribution(
                    "© OpenStreetMap contributors",
                    "https://www.openstreetmap.org/copyright"
            )
    );

    private final RestClient restClient;
    private final String apiKey;

    public GeoapifyPlacesSearchProvider(
            RestClient restClient,
            String apiKey
    ) {
        this.restClient = restClient;
        this.apiKey = apiKey;
    }

    @Override
    public List<ShopCandidate> search(ShopSearchQuery query) {
        List<String> conditions = query.dietaryMode() == DietaryMode.VEGAN
                ? List.of("vegan.only")
                : List.of("vegetarian.only", "vegan.only");

        List<ShopCandidate> candidates = new ArrayList<>();

        for (String condition : conditions) {
            GeoapifyPlacesResponse response = executeSearch(query, condition);

            if (response == null
                    || !"FeatureCollection".equals(response.type())
                    || response.features() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Dịch vụ tìm quán trả dữ liệu không hợp lệ."
                );
            }

            response.features().stream()
                    .filter(Objects::nonNull)
                    .map(GeoapifyPlacesResponse.Feature::properties)
                    .filter(Objects::nonNull)
                    .map(this::toCandidate)
                    .forEach(candidates::add);
        }

        // Policy sẽ loại quán trùng giữa hai lần tìm.
        return List.copyOf(candidates);
    }

    private GeoapifyPlacesResponse executeSearch(
            ShopSearchQuery query,
            String condition
    ) {
        int limit = Math.max(1, Math.min(query.candidateLimit(), 20));

        String center = query.longitude() + "," + query.latitude();

        try {
            return restClient.get()
                    .uri(builder -> builder
                            .path("/v2/places")
                            .queryParam("categories", "catering.restaurant")
                            .queryParam("conditions", condition)
                            .queryParam(
                                    "filter",
                                    "circle:" + center + "," + query.radiusMeters()
                            )
                            .queryParam("bias", "proximity:" + center)
                            .queryParam("limit", limit)
                            .queryParam("lang", "vi")
                            .queryParam("apiKey", apiKey)
                            .build())
                    .retrieve()
                    .body(GeoapifyPlacesResponse.class);

        } catch (RestClientResponseException exception) {
            throw translateHttpError(exception);

        } catch (ResourceAccessException exception) {
            boolean timeout = hasTimeoutCause(exception);

            throw new ResponseStatusException(
                    timeout
                            ? HttpStatus.GATEWAY_TIMEOUT
                            : HttpStatus.SERVICE_UNAVAILABLE,
                    timeout
                            ? "Dịch vụ tìm quán phản hồi quá chậm."
                            : "Hiện không thể kết nối dịch vụ tìm quán."
            );

        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Không thể đọc dữ liệu từ dịch vụ tìm quán."
            );
        }
    }

    private ShopCandidate toCandidate(
            GeoapifyPlacesResponse.Properties place
    ) {
        return new ShopCandidate(
                place.placeId(),
                place.name(),
                place.formatted(),
                place.lat(),
                place.lon(),
                toDietaryModes(place.categories()),
                null,
                "GEOAPIFY_CATEGORY",
                toMapUrl(place.lat(), place.lon()),
                ATTRIBUTIONS
        );
    }

    private Set<DietaryMode> toDietaryModes(List<String> categories) {
        if (categories == null) {
            return Set.of();
        }

        if (categories.contains("vegan.only")) {
            return Set.of(DietaryMode.VEGAN);
        }

        if (categories.contains("vegetarian.only")) {
            return Set.of(DietaryMode.VEGETARIAN);
        }

        return Set.of();
    }

    private String toMapUrl(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return null;
        }

        return "https://www.openstreetmap.org/?mlat=" + latitude
                + "&mlon=" + longitude
                + "#map=17/" + latitude + "/" + longitude;
    }

    private ResponseStatusException translateHttpError(
            RestClientResponseException exception
    ) {
        int status = exception.getStatusCode().value();

        if (status == 504) {
            return new ResponseStatusException(
                    HttpStatus.GATEWAY_TIMEOUT,
                    "Dịch vụ tìm quán phản hồi quá chậm."
            );
        }

        if (status == 401 || status == 403 || status == 429 || status >= 500) {
            return new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ tìm quán hiện chưa sẵn sàng."
            );
        }

        return new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Không thể thực hiện tìm kiếm với dịch vụ địa điểm."
        );
    }

    private boolean hasTimeoutCause(Throwable exception) {
        for (Throwable cause = exception;
             cause != null;
             cause = cause.getCause()) {

            if (cause instanceof HttpTimeoutException
                    || cause instanceof SocketTimeoutException) {
                return true;
            }
        }

        return false;
    }
}