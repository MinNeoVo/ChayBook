import { apiFetch } from "./api";

/**
 * Gửi ảnh lên AI để nhận diện nguyên liệu và gợi ý công thức nấu ăn.
 * POST /api/user/ai-recognition/scan
 * @param {File} imageFile - Tệp ảnh nguyên liệu (tối đa 10MB)
 * @param {{ signal?: AbortSignal }} options
 */
export async function scanIngredients(imageFile, { signal } = {}) {
  const formData = new FormData();
  formData.append("image", imageFile);

  return apiFetch("/user/ai-recognition/scan", {
    method: "POST",
    body: formData,
    signal,
  });
}

/**
 * Kiểm tra kết nối tới mô hình Gemini AI.
 * POST /api/user/ai-recognition/connection-check
 * @param {{ signal?: AbortSignal }} options
 */
export async function checkRecognitionConnection({ signal } = {}) {
  return apiFetch("/user/ai-recognition/connection-check", {
    method: "POST",
    signal,
  });
}

