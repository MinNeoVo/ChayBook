import API_BASE_URL from "./app";

export const DEFAULT_RECIPE_CATEGORY_ID = 1;

const API_ORIGIN = new URL(API_BASE_URL).origin;

async function requestJson(url, { signal } = {}) {
  const response = await fetch(url, { signal });
  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      data?.detail || data?.message || "The recipe request failed.",
    );
    error.status = response.status;
    throw error;
  }

  if (data === null) {
    throw new Error("The recipe service returned an invalid response.");
  }

  return data;
}

export async function getRecipes(
  categoryId = DEFAULT_RECIPE_CATEGORY_ID,
  keyword = "",
  { signal } = {},
) {
  const query = new URLSearchParams({ categoryId: String(categoryId) });
  const normalizedKeyword = keyword.trim();

  if (normalizedKeyword) {
    query.set("keyword", normalizedKeyword);
  }

  const recipes = await requestJson(
    `${API_BASE_URL}/recipes?${query.toString()}`,
    { signal },
  );

  if (!Array.isArray(recipes)) {
    throw new Error("The recipe service returned an invalid response.");
  }

  return recipes;
}

export function getRecipeById(recipeId, { signal } = {}) {
  return requestJson(
    `${API_BASE_URL}/recipes/${encodeURIComponent(recipeId)}`,
    { signal },
  );
}

export function resolveRecipeImageUrl(imageUrl) {
  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    return "";
  }

  try {
    return new URL(imageUrl, `${API_ORIGIN}/`).toString();
  } catch {
    return "";
  }
}
