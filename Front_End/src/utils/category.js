export const CATEGORY_TYPES = [
  { value: "ARTICLE", label: "Bài viết" },
  { value: "RECIPE", label: "Công thức" },
  { value: "POST", label: "Bài đăng" },
];

export const INITIAL_CATEGORY_FILTERS = {
  q: "",
  type: "",
  status: "ACTIVE",
};

export function formatCategoryId(id) {
  if (id == null || id === "") return "—";

  return `#${String(id).padStart(4, "0")}`;
}

export function toCategoryPayload(values) {
  return {
    name: values.name.trim(),
    type: values.type,
    description: values.description.trim() || null,
  };
}

export function validateCategory(payload) {
  const errors = {};

  if (!payload.name) {
    errors.name = "Vui lòng nhập tên danh mục.";
  } else if (payload.name.length > 255) {
    errors.name = "Tên danh mục không được vượt quá 255 ký tự.";
  }

  if (!CATEGORY_TYPES.some((item) => item.value === payload.type)) {
    errors.type = "Vui lòng chọn loại danh mục hợp lệ.";
  }

  return errors;
}

export function getCategoryErrorMessage(error) {
  const message = error?.data?.detail ?? error?.message;

  return (
    ERROR_TRANSLATIONS[message] ??
    HTTP_ERROR_MESSAGES[error?.status] ??
    "Không thể xử lý yêu cầu. Vui lòng thử lại."
  );
}

const ERROR_TRANSLATIONS = {
  "Tên Category không được để trống": "Vui lòng nhập tên danh mục.",

  "Tên Category tối đa 255 ký tự":
  "Tên danh mục không được vượt quá 255 ký tự.",

  "Type không được để trống": "Vui lòng chọn loại danh mục.",

  "Type phải là ARTICLE, RECIPE hoặc POST":
  "Loại danh mục phải là bài viết, công thức hoặc bài đăng.",

  "Tên Category đã tồn tại trong type này":
  "Tên danh mục này đã tồn tại trong loại đã chọn.",

  "Category đang được nội dung sử dụng":
  "Danh mục đang được sử dụng nên không thể thay đổi loại.",

  "Cannot update a deleted category": "Không thể cập nhật danh mục đã xóa.",

  "Đang xử lý thao tác trước.":
  "Một thao tác khác đang được xử lý. Vui lòng chờ.",
};

const HTTP_ERROR_MESSAGES = {
  400: "Yêu cầu không hợp lệ. Vui lòng kiểm tra thông tin đã nhập.",
  401: "Vui lòng đăng nhập để tiếp tục.",
  403: "Bạn không có quyền quản lý danh mục.",
  404: "Không tìm thấy danh mục.",
  409: "Thay đổi này xung đột với dữ liệu danh mục hiện tại.",
};

export function getCategoryFieldErrors(error) {
  return Object.fromEntries(
    Object.entries(error?.data?.errors ?? {}).map(([field, message]) => [
      field,
      ERROR_TRANSLATIONS[message] ?? "Giá trị không hợp lệ. Vui lòng kiểm tra trường này.",
    ]),
  );
}
