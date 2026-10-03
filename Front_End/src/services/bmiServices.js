import { apiFetch } from "./api";

export function createBmiRecord({ height, weight }) {
  return apiFetch("/bmi", {
    method: "POST",
    body: JSON.stringify({ height, weight }),
  });
}

export function getLatestBmi(userId, { signal } = {}) {
  return apiFetch(`/users/${encodeURIComponent(userId)}/bmi/latest`, {
    method: "GET",
    signal,
  });
}
