import { apiFetch } from "./api";

export async function uploadMedia(file) {
  const body = new FormData();
  body.append("file", file);
  return apiFetch("/media/upload", {
    method: "POST",
    body,
  });
}

/**
 * Lấy danh sách bài viết đã duyệt với phân trang
 * @param {number|string|null} categoryId - ID danh mục (nếu có)
 * @param {number} page - Số trang (mặc định: 0)
 * @param {number} size - Kích thước trang (mặc định: 10)
 * @param {object} options - Options phụ (vd: signal để hủy request nếu unmount)
 */
export async function getPosts(
  categoryId = null,
  page = 0,
  size = 10,
  { signal, sort = "latest" } = {},
) {
  const query = new URLSearchParams();

  if (categoryId && categoryId !== "all") {
    query.set("categoryId", String(categoryId));
  }

  query.set("page", String(page));
  query.set("size", String(size));
  query.set("sort", sort);

  const queryString = query.toString();
  const endpoint = `/posts${queryString ? `?${queryString}` : ""}`;

  return apiFetch(endpoint, {
    method: "GET",
    signal,
  });
}

/**
 * Tạo bài viết mới
 * @param {object} postData - { categoryId, title, content, image }
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
    const uploadedMedia = await uploadMedia(postData.image);
    if (typeof uploadedMedia?.url !== "string" || !uploadedMedia.url.startsWith("https://")) {
      throw new Error("Cloudinary did not return a secure media URL.");
    }
    formData.append("imageUrl", uploadedMedia.url);
  }

  return apiFetch("/posts", {
    method: "POST",
    body: formData,
  });
}

export async function updatePost(postId, postData) {
  if (!postId || !Number.isInteger(Number(postData.categoryId))) {
    throw new Error("Vui lòng chọn danh mục hợp lệ.");
  }

  let imageUrl = postData.imageUrl ?? "";
  if (postData.image instanceof File) {
    const uploadedMedia = await uploadMedia(postData.image);
    if (typeof uploadedMedia?.url !== "string" || !uploadedMedia.url.startsWith("https://")) {
      throw new Error("Cloudinary did not return a secure media URL.");
    }
    imageUrl = uploadedMedia.url;
  }

  const response = await apiFetch(`/posts/${encodeURIComponent(postId)}`, {
    method: "PUT",
    body: {
      categoryId: Number(postData.categoryId),
      title: postData.title.trim(),
      content: postData.content.trim(),
      imageUrl,
    },
  });
  return { ...response, imageUrl };
}

export async function withdrawPost(postId) {
  return deletePost(postId);
}

export async function deletePost(postId) {
  if (!postId) {
    throw new Error("Không tìm thấy bài viết cần xóa.");
  }

  return apiFetch(`/posts/${encodeURIComponent(postId)}`, {
    method: "DELETE",
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
