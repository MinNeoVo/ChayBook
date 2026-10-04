import API_BASE_URL from "./app";

export const apiFetch = async (endpoint, options = {}) => {
  const { headers: customHeaders, body, ...restOptions } = options;

  const headers = {
    ...(customHeaders || {}),
  };

  // Chỉ đặt Content-Type là JSON khi body không phải FormData
  if (!(body instanceof FormData) && body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
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

  // Tránh lỗi nếu server không trả về JSON
  const responseText = await response.text();
  let data;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = { message: responseText || "Server returned an invalid response" };
  }

  if (!response.ok) {
    const errorMessage =
      data?.message ||
      data?.detail ||
      data?.error ||
      `Request failed with status ${response.status}`;

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
