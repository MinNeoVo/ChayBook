package com.chaybook.backend.shop.service;

import com.chaybook.backend.shop.context.RecommendationContextResolver;
import com.chaybook.backend.shop.dto.DietaryMode;
import com.chaybook.backend.shop.dto.RecommendationSource;
import com.chaybook.backend.shop.dto.ShopAttribution;
import com.chaybook.backend.shop.dto.ShopRecommendationRequest;
import com.chaybook.backend.shop.dto.ShopRecommendationResponse;
import com.chaybook.backend.shop.dto.ShopResponse;
import com.chaybook.backend.shop.model.RecommendationContext;
import com.chaybook.backend.shop.model.ShopCandidate;
import com.chaybook.backend.shop.model.ShopSearchQuery;
import com.chaybook.backend.shop.policy.ShopRecommendationPolicy;
import com.chaybook.backend.shop.provider.ShopSearchProvider;
import com.chaybook.backend.shop.service.impl.ShopRecommendationServiceImpl;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShopRecommendationServiceTest {
    private static final int USER_ID = 27;

    @Mock private RecommendationContextResolver resolver;
    @Mock private ObjectProvider<ShopSearchProvider> providerLookup;
    @Mock private ShopSearchProvider searchProvider;
    @Mock private UserRepository userRepository;

    private ShopRecommendationService service;

    @BeforeEach
    void setUp() {
        when(resolver.supportedSource()).thenReturn(RecommendationSource.SEARCH);
        service = new ShopRecommendationServiceImpl(
                List.of(resolver), providerLookup, new ShopRecommendationPolicy(), userRepository);
    }

    @Test
    void rejectsMissingAuthenticationBeforeResolvingContextOrCallingTheProvider() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.recommend(null, request()));

        assertEquals(401, error.getStatusCode().value());
        verify(resolver, never()).resolve(anyInt(), any());
        verifyNoInteractions(userRepository, providerLookup, searchProvider);
    }

    @Test
    void rejectsAnInactiveAccountBeforeCallingTheProvider() {
        User disabled = new User();
        disabled.setStatus("DISABLED");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(disabled));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.recommend(USER_ID, request()));

        assertEquals(403, error.getStatusCode().value());
        verify(resolver, never()).resolve(anyInt(), any());
        verifyNoInteractions(providerLookup, searchProvider);
    }

    @Test
    void propagatesAnInvalidContextWithoutAttemptingAPlaceSearch() {
        activeUser();
        ResponseStatusException invalid = new ResponseStatusException(HttpStatus.NOT_FOUND, "Missing context");
        when(resolver.resolve(USER_ID, request())).thenThrow(invalid);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.recommend(USER_ID, request()));

        assertSame(invalid, error);
        verifyNoInteractions(providerLookup, searchProvider);
    }

    @Test
    void reportsUnavailableWhenNoExternalProviderHasBeenConfigured() {
        activeUser();
        resolvedContext();
        when(providerLookup.getIfAvailable()).thenReturn(null);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.recommend(USER_ID, request()));

        assertEquals(503, error.getStatusCode().value());
        verifyNoInteractions(searchProvider);
    }

    @Test
    void returnsFilteredPlacesWithDistanceEvidenceAndOriginalAttributions() {
        activeUser();
        resolvedContext();
        when(providerLookup.getIfAvailable()).thenReturn(searchProvider);
        ShopAttribution attribution = new ShopAttribution("Example provider", "https://example.com/provider");
        when(searchProvider.supportsDishSearch()).thenReturn(false);
        when(searchProvider.search(any())).thenReturn(List.of(
                new ShopCandidate(
                        "ordinary",
                        "Ordinary restaurant",
                        "Other address",
                        0.0,
                        0.0,
                        Set.of(),
                        null,
                        null,
                        null,
                        List.of()
                ),
                new ShopCandidate(
                        "vegan",
                        "Nearby vegan restaurant",
                        "Example address",
                        0.0,
                        0.001,
                        Set.of(DietaryMode.VEGAN),
                        null,
                        "GEOAPIFY_CATEGORY",
                        "https://www.openstreetmap.org/?mlat=0&mlon=0.001",
                        List.of(attribution)
                )
        ));

        ShopRecommendationResponse response = service.recommend(USER_ID, request());

        assertTrue(response.fallbackUsed());
        assertEquals(1, response.items().size());
        ShopResponse shop = response.items().getFirst();
        assertEquals("vegan", shop.placeId());
        assertEquals("Nearby vegan restaurant", shop.name());
        assertEquals("Example address", shop.address());
        assertEquals(0.001, shop.longitude());
        assertEquals(111, shop.distanceMeters(), 1);
        assertTrue(shop.reason().contains("Lau nam chay"));
        assertEquals("UNVERIFIED", shop.dishAvailability());
        assertEquals("GEOAPIFY_CATEGORY", shop.dietaryEvidence());
        assertEquals("https://www.openstreetmap.org/?mlat=0&mlon=0.001", shop.mapUrl());
        assertEquals(List.of(attribution), shop.attributions());

        ArgumentCaptor<ShopSearchQuery> query = ArgumentCaptor.forClass(ShopSearchQuery.class);
        verify(searchProvider).search(query.capture());
        assertTrue(query.getValue().textQuery().contains("Lau nam chay"));
        assertEquals(DietaryMode.VEGAN, query.getValue().dietaryMode());
        assertEquals(5000, query.getValue().radiusMeters());
        assertEquals(0.0, query.getValue().latitude());
    }

    @Test
    void emptyNearbySearchReturnsEmptyItemsAndFallbackFlag() {
        activeUser();
        resolvedContext();
        when(providerLookup.getIfAvailable()).thenReturn(searchProvider);
        when(searchProvider.search(any())).thenReturn(List.of());

        ShopRecommendationResponse response = service.recommend(USER_ID, request());

        assertTrue(response.items().isEmpty());
        assertTrue(response.fallbackUsed());
        verify(searchProvider).search(any());
    }

    private void activeUser() {
        User user = new User();
        user.setStatus("ACTIVE");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
    }

    private void resolvedContext() {
        when(resolver.resolve(USER_ID, request())).thenReturn(new RecommendationContext("Lau nam chay", null));
    }

    private static ShopRecommendationRequest request() {
        return new ShopRecommendationRequest(RecommendationSource.SEARCH, "Lau nam chay", null,
                null, null, null, BigDecimal.ZERO, BigDecimal.ZERO, 5000, DietaryMode.VEGAN, 10);
    }
}
