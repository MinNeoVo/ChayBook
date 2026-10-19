package com.chaybook.backend.shop.policy;

import com.chaybook.backend.shop.dto.DietaryMode;
import com.chaybook.backend.shop.model.RankedShop;
import com.chaybook.backend.shop.model.ShopCandidate;
import com.chaybook.backend.shop.model.ShopSearchQuery;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ShopRecommendationPolicyTest {
    private final ShopRecommendationPolicy policy = new ShopRecommendationPolicy();

    @Test
    void calculatesKnownEquatorialDistanceAndSortsByProximity() {
        List<RankedShop> results = policy.select(List.of(
                candidate("far", 0.0, 0.01), candidate("origin", 0.0, 0.0),
                candidate("near", 0.0, 0.001)), query(DietaryMode.VEGETARIAN, 5000), 10);

        assertEquals(List.of("origin", "near", "far"), ids(results));
        assertEquals(0, results.get(0).distanceMeters());
        assertEquals(111, results.get(1).distanceMeters(), 1);
        assertEquals(1112, results.get(2).distanceMeters(), 1);
    }

    @Test
    void checksRadiusBeforeRoundingDisplayedDistance() {
        // Both points round to 500 m, but the second is slightly beyond the search radius.
        List<RankedShop> results = policy.select(List.of(
                candidate("inside", 0.0, 0.0044965),
                candidate("outside", 0.0, 0.004497)), query(DietaryMode.VEGETARIAN, 500), 10);

        assertEquals(List.of("inside"), ids(results));
        assertEquals(500, results.getFirst().distanceMeters());
    }

    @Test
    void ignoresMalformedAndExplicitlyClosedCandidates() {
        List<ShopCandidate> candidates = Arrays.asList(
                null,
                candidate("", 0.0, 0.0),
                new ShopCandidate("no-name", " ", "address", 0.0, 0.0,
                        Set.of(DietaryMode.VEGETARIAN), "OPERATIONAL", "TEST_DIETARY_TAG", null, List.of()),
                candidate("missing-coordinate", null, 0.0),
                candidate("nan", Double.NaN, 0.0),
                candidate("infinite", 0.0, Double.POSITIVE_INFINITY),
                candidate("latitude-range", 90.1, 0.0),
                candidate("longitude-range", 0.0, -180.1),
                candidate("temporary", "CLOSED_TEMPORARILY", Set.of(DietaryMode.VEGETARIAN)),
                candidate("permanent", "CLOSED_PERMANENTLY", Set.of(DietaryMode.VEGETARIAN)),
                candidate("valid", 0.0, 0.0));

        assertEquals(List.of("valid"), ids(policy.select(candidates, query(DietaryMode.VEGETARIAN, 5000), 10)));
    }

    @Test
    void vegetarianAcceptsBothTypesWhileVeganDoesNotRelaxItsFilter() {
        List<ShopCandidate> candidates = List.of(
                candidate("vegetarian", "OPERATIONAL", Set.of(DietaryMode.VEGETARIAN)),
                candidate("vegan", "OPERATIONAL", Set.of(DietaryMode.VEGAN)),
                candidate("ordinary", "OPERATIONAL", Set.of()),
                candidate("unknown", "OPERATIONAL", Set.of()));

        assertEquals(List.of("vegetarian", "vegan"),
                ids(policy.select(candidates, query(DietaryMode.VEGETARIAN, 5000), 10)));
        assertEquals(List.of("vegan"),
                ids(policy.select(candidates, query(DietaryMode.VEGAN, 5000), 10)));
    }

    @Test
    void retainsFirstValidDuplicateAndOriginalOrderForEqualDistancesBeforeLimiting() {
        List<ShopCandidate> candidates = List.of(
                candidate("duplicate", "CLOSED_PERMANENTLY", Set.of(DietaryMode.VEGETARIAN)),
                candidate("duplicate", 0.0, 0.001),
                candidate("same-distance", 0.0, 0.001),
                candidate("duplicate", 0.0, 0.0),
                candidate("last", 0.0, 0.002));

        List<RankedShop> results = policy.select(candidates, query(DietaryMode.VEGETARIAN, 5000), 2);

        assertEquals(List.of("duplicate", "same-distance"), ids(results));
        assertEquals(111, results.getFirst().distanceMeters(), 1);
    }

    @Test
    void returnsEmptyWhenNoCandidateMeetsDietaryAndDistanceRequirements() {
        assertTrue(policy.select(List.of(candidate("outside", 0.0, 1.0)),
                query(DietaryMode.VEGETARIAN, 500), 10).isEmpty());
        assertTrue(policy.select(List.of(candidate("vegetarian", 0.0, 0.0)),
                query(DietaryMode.VEGAN, 500), 10).isEmpty());
        assertTrue(policy.select(List.of(), query(DietaryMode.VEGETARIAN, 500), 10).isEmpty());
    }

    private static ShopSearchQuery query(DietaryMode mode, int radius) {
        return new ShopSearchQuery("Pho chay", 0.0, 0.0, radius, mode, 10);
    }

    private static ShopCandidate candidate(String id, Double latitude, Double longitude) {
        return new ShopCandidate(id, "Shop " + id, "address", latitude, longitude,
                Set.of(DietaryMode.VEGETARIAN), "OPERATIONAL", "TEST_DIETARY_TAG", null, List.of());
    }

    private static ShopCandidate candidate(String id, String status, Set<DietaryMode> dietaryModes) {
        return new ShopCandidate(id, "Shop " + id, "address", 0.0, 0.0,
                dietaryModes, status, "TEST_DIETARY_TAG", null, List.of());
    }

    private static List<String> ids(List<RankedShop> results) {
        return results.stream().map(result -> result.candidate().placeId()).toList();
    }
}
