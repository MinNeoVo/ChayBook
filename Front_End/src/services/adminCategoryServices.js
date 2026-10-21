import { apiFetch } from "./api";

const ENDPOINT = "/admin/categories";

export const adminCategoryService = {
  async list({ type = "", q = "", status = "" } = {}, { signal } = {}) {
    const query = new URLSearchParams();

    if (type) query.set("type", type);
    if (q.trim()) query.set("q", q.trim());
    if (status) query.set("status", status);

    const suffix = query.size ? "?" + query.toString() : "";
    const data = await apiFetch(ENDPOINT + suffix, { signal });

    if (!Array.isArray(data)) {
      throw new Error("Dữ liệu danh mục không hợp lệ.");
    }

    return data;
  },

  create(payload) {
    return apiFetch(ENDPOINT, {
      method: "POST",
      body: payload,
    });
  },

  update(categoryId, payload) {
    return apiFetch(ENDPOINT + "/" + encodeURIComponent(categoryId), {
      method: "PUT",
      body: payload,
    });
  },

  remove(categoryId) {
    return apiFetch(ENDPOINT + "/" + encodeURIComponent(categoryId), {
      method: "DELETE",
    });
  },
};
