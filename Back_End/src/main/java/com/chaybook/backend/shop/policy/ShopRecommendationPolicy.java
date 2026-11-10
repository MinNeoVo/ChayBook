package com.chaybook.backend.shop.policy;

import com.chaybook.backend.shop.dto.DietaryMode;
import com.chaybook.backend.shop.model.RankedShop;
import com.chaybook.backend.shop.model.ShopCandidate;
import com.chaybook.backend.shop.model.ShopSearchQuery;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class ShopRecommendationPolicy {
    private static final double EARTH_RADIUS_METERS = 6_371_000;
    private static final Set<String> CLOSED_STATUSES = Set.of(
            "CLOSED_TEMPORARILY", "CLOSED_PERMANENTLY"
    );

    public List<RankedShop> select(List<ShopCandidate> candidates, ShopSearchQuery query, int limit) {
        Set<String> selectedPlaceIds = new HashSet<>();
        List<MeasuredCandidate> matches = new ArrayList<>();

        for (ShopCandidate candidate : candidates) {
            if (!isEligible(candidate, query.dietaryMode())) {
                continue;
            }
            double distance = distanceMeters(
                    query.latitude(), query.longitude(), candidate.latitude(), candidate.longitude()
            );
            // Apply the radius before rounding so a place just outside it cannot slip through.
            if (distance > query.radiusMeters() || !selectedPlaceIds.add(candidate.placeId())) {
                continue;
            }
            matches.add(new MeasuredCandidate(candidate, distance));
        }

        // List sorting is stable, preserving the provider's order when distances are equal.
        matches.sort(Comparator.comparingDouble(MeasuredCandidate::distanceMeters));
        return matches.stream()
                .limit(limit)
                .map(match -> new RankedShop(match.candidate(), Math.round(match.distanceMeters())))
                .toList();
    }

    private boolean isEligible(ShopCandidate candidate, DietaryMode dietaryMode) {
        if (candidate == null
                || candidate.placeId() == null || candidate.placeId().isBlank()
                || candidate.name() == null || candidate.name().isBlank()
                || !validCoordinate(candidate.latitude(), 90)
                || !validCoordinate(candidate.longitude(), 180)) {
            return false;
        }
        if (candidate.businessStatus() != null && CLOSED_STATUSES.contains(candidate.businessStatus())) {
            return false;
        }

        boolean vegan = candidate.dietaryModes().contains(DietaryMode.VEGAN);
        return switch (dietaryMode) {
            case VEGAN -> vegan;
            case VEGETARIAN -> vegan || candidate.dietaryModes().contains(DietaryMode.VEGETARIAN);
        };
    }

    private boolean validCoordinate(Double coordinate, double maximum) {
        return coordinate != null
                && Double.isFinite(coordinate)
                && coordinate >= -maximum
                && coordinate <= maximum;
    }

    private double distanceMeters(double fromLatitude, double fromLongitude,
                                  double toLatitude, double toLongitude) {
        double latitudeDelta = Math.toRadians(toLatitude - fromLatitude);
        double longitudeDelta = Math.toRadians(toLongitude - fromLongitude);
        double latitudeSin = Math.sin(latitudeDelta / 2);
        double longitudeSin = Math.sin(longitudeDelta / 2);
        double haversine = latitudeSin * latitudeSin
                + Math.cos(Math.toRadians(fromLatitude))
                * Math.cos(Math.toRadians(toLatitude)) * longitudeSin * longitudeSin;
        // Floating-point rounding can put antipodal coordinates slightly outside [0, 1].
        double clamped = Math.max(0, Math.min(1, haversine));
        return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(clamped));
    }

    private record MeasuredCandidate(ShopCandidate candidate, double distanceMeters) {
    }
}
