import { apiFetch } from "./api";

export function getNearbyShopRecommendations({
  latitude,
  longitude,
  radiusMeters = 10000,
  dietaryMode = "VEGETARIAN",
  limit = 10,
}, { signal } = {}) {
  return apiFetch("/shops/recommendations", {
    method: "POST",
    signal,
    body: {
      source: "SEARCH",
      // The current backend request still requires a non-empty query for SEARCH.
      // Geoapify's provider uses the coordinates and dietary mode for its nearby search.
      query: "nearby vegetarian restaurants",
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
