import { apiFetch } from "./api";

export function getNearbyShopRecommendations({
  latitude,
  longitude,
  radiusMeters = 10000,
  dietaryMode = "VEGETARIAN",
  limit = 10,
}) {
  return apiFetch("/shops/recommendations", {
    method: "POST",
    body: {
      source: "SEARCH",
      // This is a location-based search; no dish or shop name is required.
      query: null,
      recipeId: null,
      mealPlanId: null,
      dayNumber: null,
      mealType: null,
      latitude,
      longitude,
      radiusMeters,
      dietaryMode,
      limit,
    },
  });
}

export function geocodeShopAddress(address) {
  return apiFetch(`/shops/geocode?address=${encodeURIComponent(address)}`);
}

export function autocompleteShopAddress(text, options = {}) {
  return apiFetch(`/shops/address-suggestions?text=${encodeURIComponent(text)}`, options);
}
