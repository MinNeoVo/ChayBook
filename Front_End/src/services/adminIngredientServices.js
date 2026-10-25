import { apiFetch } from "./api";

const ENDPOINT = "/admin/ingredients";

export const adminIngredientService = {
  async list(
    { q = "", status = "", page = 0, size = 10 } = {},
    { signal } = {},
  ) {
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    if (q.trim()) {
      query.set("q", q.trim());
    }

    if (status) {
      query.set("status", status);
    }

    const data = await apiFetch(`${ENDPOINT}?${query.toString()}`, { signal });

    if (
      !Array.isArray(data?.content) ||
      !Number.isInteger(data?.number) ||
      !Number.isInteger(data?.size) ||
      !Number.isInteger(data?.totalPages) ||
      !Number.isInteger(data?.totalElements) ||
      data.content.some(
        (ingredient) =>
          ingredient.status !== "ACTIVE" && ingredient.status !== "DELETED",
      )
    ) {
      throw new Error("Dữ liệu danh sách nguyên liệu không hợp lệ.");
    }

    return data;
  },

  create(payload) {
    return apiFetch(ENDPOINT, {
      method: "POST",
      body: payload,
    });
  },

  update(ingredientId, payload) {
    return apiFetch(`${ENDPOINT}/${encodeURIComponent(ingredientId)}`, {
      method: "PUT",
      body: payload,
    });
  },

  remove(ingredientId) {
    return apiFetch(`${ENDPOINT}/${encodeURIComponent(ingredientId)}`, {
      method: "DELETE",
    });
  },

  restore(ingredientId) {
    return apiFetch(`${ENDPOINT}/${encodeURIComponent(ingredientId)}/restore`, {
      method: "PUT",
    });
  },
};
