import API_BASE_URL from "./app";

export const apiFetch = async (endpoint, options = {}) => {
  const { headers: customHeaders, body, ...restOptions } = options;

  const headers = {
    ...(customHeaders || {}),
  };

  if (!(body instanceof FormData) && body !== undefined) {
    headers["Content-Type"] =
      headers["Content-Type"] || "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    credentials: "include",
    headers,
    body:
      body instanceof FormData || typeof body === "string"
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
  });

  const responseText = await response.text();

  let data;

  try {
    data = responseText
      ? JSON.parse(responseText)
      : null;
  } catch {
    // Server trả plain text → giữ nguyên string
    data = responseText;
  }

  if (!response.ok) {
    const errorMessage =
      (typeof data === "object" && data?.message) ||
      (typeof data === "object" && data?.detail) ||
      (typeof data === "object" && data?.error) ||
      (typeof data === "string" && data) ||
      `Request failed with status ${response.status}`;

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
};