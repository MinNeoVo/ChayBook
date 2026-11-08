import API_BASE_URL from "./app";
import { apiFetch } from "./api";

const BASE = "/user/video-analyses";
const idPath = (id) => encodeURIComponent(String(id));

export function getActiveVideoSubmission({ signal } = {}) {
  return apiFetch(`${BASE}/active`, { signal, cache: "no-store" });
}

export function submitVideoFile(file, includeSummary, { signal } = {}) {
  const body = new FormData();

  body.append("file", file);
  body.append("includeSummary", String(includeSummary));

  return apiFetch(`${BASE}/uploads`, {
    method: "POST",
    body,
    signal,
  });
}

export function submitVideoUrl(url, includeSummary, { signal } = {}) {
  return apiFetch(`${BASE}/urls`, {
    method: "POST",
    body: {
      url: url.trim(),
      includeSummary,
    },
    signal,
  });
}

export function getVideoSubmission(id, { signal } = {}) {
  return apiFetch(`${BASE}/submissions/${idPath(id)}`, { signal });
}

export function getVideoAnalysis(id, { signal } = {}) {
  return apiFetch(`${BASE}/${idPath(id)}`, { signal });
}

export function updateVideoDraft(id, version, draft, { signal } = {}) {
  return apiFetch(`${BASE}/${idPath(id)}/draft`, {
    method: "PUT",
    body: { version, draft },
    signal,
  });
}

export function confirmVideoRecipe(id, version, { signal } = {}) {
  return apiFetch(`${BASE}/${idPath(id)}/confirm`, {
    method: "POST",
    body: { version },
    signal,
  });
}

export async function getMyRecipes(page = 0, { signal } = {}) {
  const query = new URLSearchParams({
    page: String(page),
    size: "10",
  });

  const data = await apiFetch(`/user/recipes?${query}`, {
    signal,
  });

  if (
    !Array.isArray(data?.content) ||
    !Number.isInteger(data.totalPages) ||
    !Number.isInteger(data.number) ||
    !Number.isInteger(data.size) ||
    !Number.isInteger(data.totalElements)
  ) {
    throw new Error("Máy chủ trả danh sách công thức không hợp lệ.");
  }

  return data;
}

export function getMyRecipe(id, { signal } = {}) {
  return apiFetch(`/user/recipes/${idPath(id)}`, {
    signal,
  });
}

export function getVideoMediaUrl(submissionId) {
  return `${API_BASE_URL}${BASE}/submissions/${idPath(submissionId)}/media`;
}
