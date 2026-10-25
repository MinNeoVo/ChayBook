export const INITIAL_INGREDIENT_FILTERS = {
  q: "",
  status: "",
  page: 0,
  size: 10,
};

export const INGREDIENT_STATUS_LABELS = {
  ACTIVE: "Đang hoạt động",
  DELETED: "Đã xóa",
};

export function formatIngredientId(id) {
  return `#${String(id).padStart(4, "0")}`;
}

export function toIngredientPayload(values) {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
  };
}

export function validateIngredient(payload) {
  const errors = {};

  if (!payload.name) {
    errors.name = "Vui lòng nhập tên nguyên liệu.";
  } else if (payload.name.length > 255) {
    errors.name = "Tên nguyên liệu không được vượt quá 255 ký tự.";
  }

  if (payload.description?.length > 5000) {
    errors.description = "Mô tả nguyên liệu không được vượt quá 5000 ký tự.";
  }

  return errors;
}

export function getIngredientErrorMessage(error) {
  const messages = {
    401: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
    403: "Bạn không có quyền thực hiện thao tác này.",
    404: "Nguyên liệu không tồn tại hoặc đã bị xóa.",
  };

  if (messages[error?.status]) {
    return messages[error.status];
  }

  if (error?.status >= 500) {
    return "Máy chủ hiện không khả dụng. Vui lòng thử lại sau.";
  }

  return (
    error?.data?.detail ||
    error?.message ||
    "Không thể thực hiện thao tác. Vui lòng thử lại sau."
  );
}
