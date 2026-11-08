export const MAX_VIDEO_BYTES = 50_000_000;

export const SUBMISSION_WAITING = ["QUEUED", "CHECKING"];

export const ANALYSIS_WAITING = ["QUEUED", "PROCESSING"];

export const ANALYSIS_EDITABLE = ["READY", "PARTIAL"];

const STATUS_LABELS = {
  QUEUED: "Đang chờ xử lý",
  CHECKING: "Đang kiểm tra chủ đề và đồ ăn chay",
  ACCEPTED: "Video đã được chấp nhận",
  REJECTED: "Video không phù hợp",
  UNDETERMINED: "Chưa đủ căn cứ để chấp nhận video",
  PROCESSING: "Đang trích xuất nội dung",
  READY: "Đã có bản nháp — hãy xem lại",
  PARTIAL: "Kết quả còn thiếu thông tin",
  NO_RECIPE: "Video không cung cấp nội dung công thức",
  FAILED: "Không hoàn tất được việc xử lý",
  CONFIRMED: "Đã lưu công thức riêng",
};

const ERROR_LABELS = {
  NOT_FOOD_CONTENT: "Video không thuộc chủ đề thức ăn.",

  NON_VEGETARIAN_CONTENT: "Video có nguyên liệu không phù hợp đồ ăn chay.",

  FOOD_TOPIC_UNCERTAIN: "Chưa xác định được chủ đề video.",

  VEGETARIAN_STATUS_UNCERTAIN: "Chưa đủ căn cứ xác định món ăn chay.",

  PROCESSING_TIMEOUT: "Xử lý quá thời gian cho phép.",

  SOURCE_EXPIRED: "File video tạm đã hết thời hạn lưu.",

  INVALID_AI_RESPONSE: "AI chưa trả được kết quả hợp lệ.",

  AI_PROVIDER_FAILED: "Dịch vụ phân tích video chưa trả được kết quả.",

  AI_NOT_CONFIGURED: "Dịch vụ phân tích video chưa được cấu hình.",
  AI_AUTH_FAILED: "Dịch vụ phân tích không xác thực được. Cần kiểm tra API key ở backend.",
  AI_ACCESS_DENIED: "Gemini từ chối quyền truy cập. Cần kiểm tra quyền API và dự án.",
  AI_BILLING_REQUIRED: "Dịch vụ AI yêu cầu kiểm tra số dư hoặc cấu hình thanh toán.",
  AI_RESOURCE_NOT_FOUND: "Gemini không tìm thấy model hoặc tài nguyên video được yêu cầu.",
  AI_QUOTA_EXCEEDED: "Dịch vụ AI đã vượt hạn mức hoặc giới hạn lượt gọi. Vui lòng thử lại sau.",
  AI_PROVIDER_BAD_REQUEST: "Gemini không chấp nhận yêu cầu video. Cần kiểm tra cấu hình và log backend.",
  AI_PROVIDER_UNAVAILABLE: "Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.",
  AI_PROVIDER_TIMEOUT: "Dịch vụ AI phản hồi quá thời gian chờ. Vui lòng thử lại sau.",
  AI_NETWORK_ERROR: "Backend không kết nối được dịch vụ AI. Hãy kiểm tra kết nối mạng.",
  AI_NO_RESULT: "Dịch vụ AI không trả về kết quả cho video này.",
  YOUTUBE_VIDEO_TOO_LONG: "Video YouTube tối đa 15 phút.",

  AI_UPLOAD_FAILED: "Không gửi được video tới dịch vụ phân tích.",

  AI_FILE_TIMEOUT: "Dịch vụ phân tích chưa chuẩn bị video kịp thời.",

  AI_INCOMPLETE_RESPONSE: "Kết quả phân tích chưa hoàn chỉnh.",

  VIDEO_UNAVAILABLE: "Video nguồn không còn truy cập được.",

  SOURCE_CHANGED: "Video nguồn đã thay đổi. Hãy gửi lại.",

  USER_INACTIVE: "Tài khoản hiện không hoạt động.",
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || "Đang tải";
}

export function videoError(error) {
  if (error?.status === 401) {
    return "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.";
  }

  if (error?.status === 403) {
    return "Tài khoản hiện tại không có quyền thực hiện thao tác.";
  }

  if (error?.status === 404) {
    return "Không tìm thấy dữ liệu thuộc tài khoản của bạn.";
  }

  const code = typeof error === "string" ? error : error?.data?.code;

  return (
    ERROR_LABELS[code] ||
    error?.message ||
    "Không hoàn tất được thao tác. Hãy thử lại."
  );
}

export function positiveId(value) {
  if (!/^\d+$/.test(String(value))) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 && id <= 2147483647 ? id : null;
}

export function formatVideoTime(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));

  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export function youtubeId(url) {
  try {
    const value = new URL(url);

    if (
      value.protocol !== "https:" ||
      value.username ||
      value.password ||
      (value.port && value.port !== "443")
    ) {
      return null;
    }

    let id = null;

    if (value.hostname === "youtu.be") {
      id = value.pathname.split("/")[1];
    } else if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(
        value.hostname,
      )
    ) {
      if (value.pathname === "/watch") {
        id = value.searchParams.get("v");
      }

      if (value.pathname.startsWith("/shorts/")) {
        id = value.pathname.split("/")[2];
      }
    }

    return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : null;
  } catch {
    return null;
  }
}

export function normalizeDraft(draft) {
  return {
    name: draft.name?.trim() || null,

    ingredients: (draft.ingredients || []).map((item) => ({
      ingredientId: item.ingredientId ?? null,
      name: item.name.trim(),
      amountText: item.amountText?.trim() || null,
    })),

    steps: (draft.steps || []).map((step) => step.trim()),
  };
}

export function draftError(draft) {
  if ((draft.name?.length || 0) > 255) {
    return "Tên món tối đa 255 ký tự.";
  }

  if (draft.ingredients.length > 100 || draft.steps.length > 100) {
    return "Tối đa 100 nguyên liệu và 100 bước.";
  }

  if (
    draft.ingredients.some(
      (item) =>
        !item.name ||
        item.name.length > 255 ||
        (item.amountText?.length || 0) > 255,
    )
  ) {
    return "Điền tên nguyên liệu; tên và định lượng tối đa 255 ký tự.";
  }

  if (draft.steps.some((step) => !step || step.length > 2000)) {
    return "Điền nội dung từng bước hoặc xóa bước trống; tối đa 2000 ký tự/bước.";
  }

  return "";
}

export function isCompleteDraft(draft) {
  return (
    !draftError(draft) &&
    Boolean(draft.name) &&
    draft.ingredients.length > 0 &&
    draft.steps.length > 0
  );
}
