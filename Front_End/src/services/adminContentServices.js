import { apiFetch } from "./api";
import API_BASE_URL from "./app";

function queryString(values) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      query.set(key, String(value));
    }
  });
  return query.toString();
}

export function validateAdminPage(data) {
  if (!Array.isArray(data?.items) ||
      ![data.page, data.size, data.totalElements, data.totalPages].every(Number.isSafeInteger) ||
      data.page < 0 || data.size < 1 || data.totalElements < 0 || data.totalPages < 0) {
    throw new Error("The admin API returned an invalid page.");
  }
  return data;
}

export function getAdminCategories(type, { signal } = {}) {
  return apiFetch(`/admin/categories?${queryString({ type })}`, { signal }).then((data) => {
    if (!Array.isArray(data)) throw new Error("Invalid admin categories response.");
    return data;
  });
}

export function getAdminArticles({ signal, ...filters } = {}) {
  return apiFetch(`/admin/articles?${queryString({ page: 0, size: 6, ...filters })}`, { signal })
    .then(validateAdminPage);
}

export function getAdminArticle(id, { signal } = {}) {
  return apiFetch(`/admin/articles/${encodeURIComponent(id)}`, { signal });
}

export function createAdminArticle(body) {
  return apiFetch("/admin/articles", { method: "POST", body });
}

export function updateAdminArticle(id, body) {
  return apiFetch(`/admin/articles/${encodeURIComponent(id)}`, { method: "PUT", body });
}

export function deleteAdminArticle(id) {
  return apiFetch(`/admin/articles/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function uploadAdminArticleImage(file) {
  const body = new FormData();
  body.append("file", file);
  return apiFetch("/admin/articles/images", { method: "POST", body });
}

export function getAdminRecipes({ signal, ...filters } = {}) {
  return apiFetch(`/admin/recipes?${queryString({ page: 0, size: 10, ...filters })}`, { signal })
    .then(validateAdminPage);
}

export function getAdminRecipe(id, { signal } = {}) {
  return apiFetch(`/admin/recipes/${encodeURIComponent(id)}`, { signal });
}

export function createAdminRecipe(body) {
  return apiFetch("/admin/recipes", { method: "POST", body });
}

export function updateAdminRecipe(id, body) {
  return apiFetch(`/admin/recipes/${encodeURIComponent(id)}`, { method: "PUT", body });
}

export function deleteAdminRecipe(id) {
  return apiFetch(`/admin/recipes/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function getAdminRecipeIngredients({ signal } = {}) {
  // Shared, authenticated reference data; recipe writes use admin endpoints.
  return apiFetch("/ingredients", { signal }).then((data) => {
    if (!Array.isArray(data)) throw new Error("Invalid ingredients response.");
    return data;
  });
}

export function getAdminSubmissions({ signal, ...filters } = {}) {
  return apiFetch(`/admin/posts-videos?${queryString({ page: 0, size: 7, ...filters })}`, { signal })
    .then(validateAdminPage);
}

export function getAdminSubmissionStatistics({ signal } = {}) {
  return apiFetch("/admin/posts-videos/statistics", { signal }).then((data) => {
    if (![data?.totalSubmission, data?.pendingModeration, data?.approvedLive, data?.rejectedEntries]
      .every((value) => Number.isSafeInteger(value) && value >= 0)) {
      throw new Error("Invalid moderation statistics response.");
    }
    return data;
  });
}

export function getAdminSubmission(type, id, { signal } = {}) {
  return apiFetch(`/admin/posts-videos/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, { signal });
}

export function updateAdminSubmissionStatus(type, id, status, reason = null) {
  return apiFetch(`/admin/posts-videos/${encodeURIComponent(type)}/${encodeURIComponent(id)}/status`, {
    method: "PATCH", body: { status, reason },
  });
}

export function resolveAdminMediaUrl(value) {
  if (!value || typeof value !== "string") return "";
  try {
    const url = new URL(value, `${new URL(API_BASE_URL).origin}/`);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
