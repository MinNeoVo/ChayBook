import { apiFetch } from "./api";

export function getAllergies({ signal } = {}) {
  return apiFetch("/allergies", { method: "GET", signal });
}

export function getMyAllergies({ signal } = {}) {
  return apiFetch("/users/me/allergies", { method: "GET", signal });
}

export function updateMyAllergies(allergyIds) {
  return apiFetch("/users/me/allergies", {
    method: "PUT",
    body: JSON.stringify({ allergyIds }),
  });
}
