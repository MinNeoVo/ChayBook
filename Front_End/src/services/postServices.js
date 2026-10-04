import { apiFetch } from "./api";

/**
 * Lấy danh sách bài viết đã duyệt
 * @param {number|string|null} categoryId - ID danh mục (nếu có)
 * @param {object} options - Options phụ (vd: signal để hủy request nếu unmount)
 */
export async function getPosts(categoryId = null, { signal } = {}) {
  const query = new URLSearchParams();

  if (categoryId && categoryId !== "all") {
    query.set("categoryId", String(categoryId));
  }

  const queryString = query.toString();
  const endpoint = `/posts${queryString ? `?${queryString}` : ""}`;

  return apiFetch(endpoint, {
    method: "GET",
    signal,
  });
}

/**
 * Tạo bài viết mới
 * @param {object} postData - { categoryId, title, content, imageUrl }
 */

export async function createPost(postData) {
  if (!postData.categoryId || !Number.isInteger(Number(postData.categoryId))) {
    throw new Error("Vui lòng chọn danh mục hợp lệ.");
  }

  const formData = new FormData();
  formData.append("categoryId", String(postData.categoryId));
  formData.append("title", postData.title.trim());
  formData.append("content", postData.content.trim());

  if (postData.image instanceof File) {
    formData.append("image", postData.image);
  }

  return apiFetch("/posts", {
    method: "POST",
    body: formData,
  });
}

/**
 * Thêm tương tác (LIKE hoặc BOOKMARK)
 * @param {number} postId
 * @param {"LIKE"|"BOOKMARK"} type
 */
export async function addPostInteraction(postId, type) {
  return apiFetch(`/posts/${postId}/interactions`, {
    method: "POST",
    body: JSON.stringify({ type }),
  });
}

/**
 * Hủy tương tác (LIKE hoặc BOOKMARK)
 * @param {number} postId
 * @param {"LIKE"|"BOOKMARK"} type
 */
export async function removePostInteraction(postId, type) {
  return apiFetch(
    `/posts/${postId}/interactions?type=${encodeURIComponent(type)}`,
    {
      method: "DELETE",
    },
  );
}
