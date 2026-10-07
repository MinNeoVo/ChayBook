import { apiFetch } from "./api";

/**
 * Lấy danh sách bài viết
 * @param {number|null} categoryId - ID danh mục (nếu có)
 * @param {object} options - Options phụ (vd: signal để hủy request nếu unmount)
 */
export async function getArticles(categoryId = null, { signal, status } = {}) {
  const query = new URLSearchParams();

  if (categoryId && categoryId !== "all") {
    query.set("categoryId", String(categoryId));
  }

  if (typeof status === "string" && status.trim()) {
    query.set("status", status.trim());
  }

  const queryString = query.toString();
  const endpoint = `/articles${queryString ? `?${queryString}` : ""}`;

  return apiFetch(endpoint, {
    method: "GET",
    signal,
  });
}

/**
 * Lấy chi tiết bài viết
 * @param {number} articleId - ID bài viết
 */
export async function getArticleDetail(articleId) {
  return apiFetch(`/articles/${articleId}`, {
    method: "GET",
  });
}
