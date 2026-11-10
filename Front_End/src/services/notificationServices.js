import { apiFetch } from "./api";

/**
 * Lấy danh sách thông báo và số lượng chưa đọc của người dùng hiện tại.
 * GET /api/notifications
 * @param {{ signal?: AbortSignal }} options
 */
export async function getNotifications({ signal } = {}) {
  return apiFetch("/notifications", {
    method: "GET",
    signal,
  });
}

/**
 * Đánh dấu 1 thông báo là đã đọc.
 * PATCH /api/notifications/{notificationId}/read
 * @param {number} notificationId
 */
export async function markNotificationAsRead(notificationId) {
  return apiFetch(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
    {
      method: "PATCH",
    }
  );
}

/**
 * Đánh dấu tất cả thông báo của người dùng hiện tại là đã đọc.
 * PATCH /api/notifications/read-all
 */
export async function markAllNotificationsAsRead() {
  return apiFetch("/notifications/read-all", {
    method: "PATCH",
  });
}

