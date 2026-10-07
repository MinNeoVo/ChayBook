import { apiFetch } from "./api";

export function getAdminUsers({ page = 0, size = 10, signal } = {}) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return apiFetch(`/admin/users?${query.toString()}`, {
    method: "GET",
    signal,
  });
}

export function getAdminUserStatistics({ signal } = {}) {
  return apiFetch("/admin/users/statistics", {
    method: "GET",
    signal,
  });
}

export function updateAdminUserStatus(userId, status, { signal } = {}) {
  return apiFetch(`/admin/users/${encodeURIComponent(userId)}/status`, {
    method: "PATCH",
    signal,
    body: { status },
  });
}
