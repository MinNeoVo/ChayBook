import API_BASE_URL from "./app";

const API_ORIGIN = new URL(API_BASE_URL).origin;

async function requestJson(url, { signal } = {}) {
  const response = await fetch(url, { signal });
  let data;

  try {
    data = await response.json();
  } catch (error) {
    console.error("Failed to parse the recipe service response:", error);
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
  categoryId = null,
  keyword = "",
  { signal } = {},
) {
  const query = new URLSearchParams();
  const normalizedCategoryId =
    categoryId === null || categoryId === undefined
      ? ""
      : String(categoryId).trim();
  const normalizedKeyword = typeof keyword === "string" ? keyword.trim() : "";

  if (normalizedCategoryId) {
    query.set("categoryId", normalizedCategoryId);
  }

  if (normalizedKeyword) {
    query.set("keyword", normalizedKeyword);
  }

  const queryString = query.toString();
  const recipes = await requestJson(
    `${API_BASE_URL}/recipes${queryString ? `?${queryString}` : ""}`,
    { signal },
  );

  if (!Array.isArray(recipes)) {
    throw new Error("The recipe service returned an invalid response.");
  }

  return recipes;
}

export async function getRecipeCategories({ signal } = {}) {
  const categories = await requestJson(`${API_BASE_URL}/categories`, { signal });

  if (!Array.isArray(categories)) {
    throw new Error("The category service returned an invalid response.");
  }

  return categories;
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
  } catch (error) {
    console.error("Failed to resolve recipe image URL:", error);
    return "";
  }
}
