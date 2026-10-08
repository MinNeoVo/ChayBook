import { apiFetch } from "./api";

export function getAdminArticlePage({ page = 0, size = 1, signal } = {}) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return apiFetch("/admin/articles?" + query.toString(), {
    method: "GET",
    signal,
  });
}

const DASHBOARD_STATISTICS_PATH = "/admin/dashboard/statistics";

export function getAdminInteractionRate({ signal } = {}) {
  return apiFetch(DASHBOARD_STATISTICS_PATH + "/interaction-rate", {
    method: "GET",
    signal,
  });
}

export function getAdminAiMessageCount({ signal } = {}) {
  return apiFetch(DASHBOARD_STATISTICS_PATH + "/ai-messages", {
    method: "GET",
    signal,
  });
}

export function getAdminInteractionChart({ days = 7, signal } = {}) {
  const query = new URLSearchParams({ days: String(days) });

  return apiFetch(
    DASHBOARD_STATISTICS_PATH + "/interactions?" + query.toString(),
    {
      method: "GET",
      signal,
    },
  );
}

export function getAdminTopContributors({ signal } = {}) {
  return apiFetch(DASHBOARD_STATISTICS_PATH + "/top-contributors", {
    method: "GET",
    signal,
  });
}
