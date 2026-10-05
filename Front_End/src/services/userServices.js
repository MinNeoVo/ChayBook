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
