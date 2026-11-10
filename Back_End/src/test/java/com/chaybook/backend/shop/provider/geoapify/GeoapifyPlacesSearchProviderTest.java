package com.chaybook.backend.shop.provider.geoapify;

import com.chaybook.backend.shop.dto.DietaryMode;
import com.chaybook.backend.shop.model.ShopCandidate;
import com.chaybook.backend.shop.model.ShopSearchQuery;
import com.chaybook.backend.shop.policy.ShopRecommendationPolicy;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.ResponseActions;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.net.http.HttpTimeoutException;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/** Exercises the HTTP adapter with intercepted requests; no real key or network is used. */
class GeoapifyPlacesSearchProviderTest {
    private static final String TEST_KEY = "test-only-geoapify-key-not-valid";
    private static final String BASE_URL = "https://geoapify.invalid";

    private final ShopRecommendationPolicy policy = new ShopRecommendationPolicy();
    private MockRestServiceServer server;
    private GeoapifyPlacesSearchProvider provider;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
        server = MockRestServiceServer.bindTo(builder).build();
        provider = new GeoapifyPlacesSearchProvider(builder.build(), TEST_KEY);
    }

    @AfterEach
    void verifyRequests() {
        server.verify();
    }

    @Test
    void veganSearchSendsLongitudeFirstAndMapsCoordinatesDietAndAttribution() {
        expectSearch("vegan.only", 20).andRespond(withSuccess(
                collection(feature("vegan", "10.7769", "106.7009", "[\"vegan.only\"]")),
                MediaType.APPLICATION_JSON));

        List<ShopCandidate> candidates = provider.search(query(DietaryMode.VEGAN, 20));

        assertEquals(1, candidates.size());
        ShopCandidate shop = candidates.getFirst();
        assertEquals("vegan", shop.placeId());
        assertEquals("Shop vegan", shop.name());
        assertEquals("Test address", shop.address());
        assertEquals(10.7769, shop.latitude());
        assertEquals(106.7009, shop.longitude());
        assertEquals(Set.of(DietaryMode.VEGAN), shop.dietaryModes());
        assertEquals("GEOAPIFY_CATEGORY", shop.dietaryEvidence());
        assertNull(shop.businessStatus());
        assertEquals("https://www.openstreetmap.org/?mlat=10.7769&mlon=106.7009#map=17/10.7769/106.7009",
                shop.mapUrl());
        assertEquals(List.of("https://www.geoapify.com/", "https://www.openstreetmap.org/copyright"),
                shop.attributions().stream().map(attribution -> attribution.providerUri()).toList());
        assertFalse(provider.supportsDishSearch());
    }

    @Test
    void vegetarianSearchCombinesBothDietsAndPolicyRemovesDuplicates() {
        String vegan = feature("vegan", "10.7769", "106.7009", "[\"vegan.only\"]");
        String vegetarian = feature("vegetarian", "10.7779", "106.7009", "[\"vegetarian.only\"]");
        expectSearch("vegetarian.only", 20).andRespond(withSuccess(
                collection(vegetarian, vegan), MediaType.APPLICATION_JSON));
        expectSearch("vegan.only", 20).andRespond(withSuccess(
                collection(vegan), MediaType.APPLICATION_JSON));
        ShopSearchQuery query = query(DietaryMode.VEGETARIAN, 20);

        List<ShopCandidate> candidates = provider.search(query);

        assertEquals(3, candidates.size());
        assertEquals(Set.of(DietaryMode.VEGETARIAN), candidates.getFirst().dietaryModes());
        assertEquals(List.of("vegan", "vegetarian"), policy.select(candidates, query, 10).stream()
                .map(shop -> shop.candidate().placeId()).toList());
    }

    @Test
    void emptyFeatureCollectionIsASuccessfulEmptySearch() {
        expectSearch("vegan.only", 20).andRespond(withSuccess(collection(), MediaType.APPLICATION_JSON));

        assertTrue(provider.search(query(DietaryMode.VEGAN, 20)).isEmpty());
    }

    @Test
    void nullFeaturesAndMissingPropertiesDoNotDiscardOtherValidPlaces() {
        expectSearch("vegan.only", 20).andRespond(withSuccess(collection(
                "null", "{}", "{\"properties\":null}",
                feature("valid", "10.7769", "106.7009", "[\"vegan.only\"]")),
                MediaType.APPLICATION_JSON));

        assertEquals(List.of("valid"), provider.search(query(DietaryMode.VEGAN, 20)).stream()
                .map(ShopCandidate::placeId).toList());
    }

    @ParameterizedTest
    @ValueSource(strings = {"null", "[]", "[\"vegan\"]", "[\"vegetarian\"]"})
    void placesWithoutExclusiveDietEvidenceAreRejectedByPolicy(String categories) {
        expectSearch("vegan.only", 20).andRespond(withSuccess(collection(
                feature("unverified", "10.7769", "106.7009", categories)), MediaType.APPLICATION_JSON));
        ShopSearchQuery query = query(DietaryMode.VEGAN, 20);

        List<ShopCandidate> candidates = provider.search(query);

        assertTrue(candidates.getFirst().dietaryModes().isEmpty());
        assertTrue(policy.select(candidates, query, 10).isEmpty());
    }

    @ParameterizedTest
    @CsvSource({"null,106.7009", "10.7769,null", "91,106.7009", "10.7769,181"})
    void invalidPlaceCoordinatesCannotReachRecommendations(String latitude, String longitude) {
        expectSearch("vegan.only", 20).andRespond(withSuccess(collection(
                feature("invalid", latitude, longitude, "[\"vegan.only\"]")), MediaType.APPLICATION_JSON));
        ShopSearchQuery query = query(DietaryMode.VEGAN, 20);

        assertTrue(policy.select(provider.search(query), query, 10).isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{}",
            "{\"type\":\"FeatureCollection\"}",
            "{\"type\":\"Feature\",\"features\":[]}",
            "not-json"
    })
    void malformedOrWrongResponseShapeReturnsBadGateway(String responseBody) {
        expectSearch("vegan.only", 20).andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        assertStatus(502);
    }

    @Test
    void missingResponseBodyReturnsBadGateway() {
        expectSearch("vegan.only", 20).andRespond(withStatus(HttpStatus.NO_CONTENT));

        assertStatus(502);
    }

    @ParameterizedTest
    @CsvSource({"400,502", "401,503", "403,503", "404,502", "429,503", "500,503", "503,503", "504,504"})
    void upstreamHttpErrorsAreTranslatedWithoutExposingTheKey(int upstreamStatus, int expectedStatus) {
        expectSearch("vegan.only", 20).andRespond(withStatus(HttpStatusCode.valueOf(upstreamStatus))
                .body("Upstream details including apiKey=" + TEST_KEY));

        ResponseStatusException error = assertStatus(expectedStatus);

        assertFalse(error.toString().contains(TEST_KEY));
        assertNull(error.getCause());
    }

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void connectionAndReadTimeoutsReturnGatewayTimeout(boolean jdkTimeout) {
        expectSearch("vegan.only", 20).andRespond(request -> {
            if (jdkTimeout) {
                throw new HttpTimeoutException("test timeout");
            }
            throw new SocketTimeoutException("test timeout");
        });

        assertStatus(504);
    }

    @Test
    void connectionFailureReturnsServiceUnavailable() {
        expectSearch("vegan.only", 20).andRespond(request -> {
            throw new UnknownHostException("test host unavailable");
        });

        assertStatus(503);
    }

    @ParameterizedTest
    @CsvSource({"-1,1", "0,1", "1,1", "10,10", "100,20"})
    void candidateLimitIsBoundedBeforeSendingTheRequest(int requested, int expected) {
        expectSearch("vegan.only", expected)
                .andRespond(withSuccess(collection(), MediaType.APPLICATION_JSON));

        assertTrue(provider.search(query(DietaryMode.VEGAN, requested)).isEmpty());
    }

    @Test
    void failureOfTheSecondDietQueryDoesNotSilentlyReturnPartialResults() {
        expectSearch("vegetarian.only", 20).andRespond(withSuccess(collection(
                feature("vegetarian", "10.7769", "106.7009", "[\"vegetarian.only\"]")),
                MediaType.APPLICATION_JSON));
        expectSearch("vegan.only", 20).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> provider.search(query(DietaryMode.VEGETARIAN, 20)));

        assertEquals(503, error.getStatusCode().value());
    }

    private ResponseActions expectSearch(String condition, int limit) {
        return server.expect(method(HttpMethod.GET))
                .andExpect(request -> {
                    assertEquals("geoapify.invalid", request.getURI().getHost());
                    assertEquals("/v2/places", request.getURI().getPath());
                    assertFalse(request.getURI().getRawQuery().contains("name="),
                            "A recipe name must not be used as a restaurant-name filter");
                })
                .andExpect(queryParam("categories", "catering.restaurant"))
                .andExpect(queryParam("conditions", condition))
                .andExpect(queryParam("filter", "circle:106.7009,10.7769,5000"))
                .andExpect(queryParam("bias", "proximity:106.7009,10.7769"))
                .andExpect(queryParam("limit", String.valueOf(limit)))
                .andExpect(queryParam("lang", "vi"))
                .andExpect(queryParam("apiKey", TEST_KEY));
    }

    private ResponseStatusException assertStatus(int expectedStatus) {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> provider.search(query(DietaryMode.VEGAN, 20)));
        assertEquals(expectedStatus, error.getStatusCode().value());
        return error;
    }

    private static ShopSearchQuery query(DietaryMode mode, int candidateLimit) {
        return new ShopSearchQuery("Pho chay", 10.7769, 106.7009, 5000, mode, candidateLimit);
    }

    private static String collection(String... features) {
        return "{\"type\":\"FeatureCollection\",\"features\":[" + String.join(",", features) + "]}";
    }

    private static String feature(String id, String latitude, String longitude, String categories) {
        return """
                {"type":"Feature","properties":{
                  "place_id":"%s","name":"Shop %s","formatted":"Test address",
                  "lat":%s,"lon":%s,"categories":%s,
                  "unknown_provider_field":"must be ignored"
                }}
                """.formatted(id, id, latitude, longitude, categories);
    }
}
