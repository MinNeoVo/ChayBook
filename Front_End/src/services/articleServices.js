import { apiFetch } from "./api";

/**
 * Lấy danh sách bài viết với phân trang
 * @param {number|null} categoryId - ID danh mục (nếu có)
 * @param {number} page - Số trang (mặc định: 0)
 * @param {number} size - Kích thước trang (mặc định: 10)
 * @param {string|null} status - Trạng thái bài viết (tùy chọn)
 * @param {object} options - Options phụ (vd: signal để hủy request nếu unmount)
 */
export async function getArticles(categoryId = null, page = 0, size = 10, status = null, { signal } = {}) {
  const query = new URLSearchParams();

  if (categoryId && categoryId !== "all") {
    query.set("categoryId", String(categoryId));
  }

  if (typeof status === "string" && status.trim()) {
    query.set("status", status.trim());
  }

  query.set("page", String(page));
  query.set("size", String(size));

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
