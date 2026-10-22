import { apiFetch } from "./api";

/**
 * Lấy thông tin profile + danh sách bài viết của user đang đăng nhập.
 * GET /api/users/me/profile
 */
export async function getMyProfile({ signal } = {}) {
  return apiFetch("/users/me/profile", {
    method: "GET",
    signal,
  });
}

/**
 * Cập nhật thông tin profile của user.
 * PUT /api/users/{userId}
 * @param {number} userId
 * @param {{ username: string, fullName: string, avatarUrl?: string }} data
 */
export async function updateProfile(userId, data) {
  return apiFetch(`/users/${userId}`, {
    method: "PUT",
    body: data,
  });
}

/**
 * Change the authenticated user's password.
 * PUT /api/users/{userId}/password
 */
export async function changePassword(userId, currentPassword, newPassword, email, resetToken) {
  return apiFetch(`/users/${encodeURIComponent(userId)}/password`, {
    method: "PUT",
    body: { currentPassword, newPassword, email, resetToken },
  });
}

/**
 * Upload ảnh avatar cho user đang đăng nhập.
 * POST /api/users/me/avatar
 * @param {File} file - File ảnh (JPEG/PNG/WebP, tối đa 5MB)
 */
export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch("/users/me/avatar", {
    method: "POST",
    body: formData,
  });
}
