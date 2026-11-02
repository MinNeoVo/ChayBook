import { apiFetch } from "./api";

export function getMealPlans({ signal } = {}) {
  return apiFetch("/meal-plans", { method: "GET", signal });
}

export function createMealPlan({ healthGoal, durationDays, dietaryPreference }) {
  return apiFetch("/meal-plans", {
    method: "POST",
    body: JSON.stringify({ healthGoal, durationDays, dietaryPreference }),
  });
}
