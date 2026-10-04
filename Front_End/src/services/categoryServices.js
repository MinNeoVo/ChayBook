import { apiFetch } from "./api";

export async function getCategories(type = null, { signal } = {}) {
  const query = new URLSearchParams();

  if (type) {
    query.set("type", type);
  }

  const queryString = query.toString();
  const endpoint = `/categories${queryString ? `?${queryString}` : ""}`;

  const data = await apiFetch(endpoint, {
    method: "GET",
    signal,
  });

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  throw new Error("Dữ liệu danh mục không hợp lệ.");
}
