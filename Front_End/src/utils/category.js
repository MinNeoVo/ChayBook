export const CATEGORY_TYPES = [
  { value: "ARTICLE", label: "Article" },
  { value: "RECIPE", label: "Recipe" },
  { value: "POST", label: "Post" },
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
    errors.name = "Please enter a category name";
  } else if (payload.name.length > 255) {
    errors.name = "Category name must not exceed 255 characters";
  }

  if (!CATEGORY_TYPES.some((item) => item.value === payload.type)) {
    errors.type = "Please select a valid category type";
  }

  return errors;
}

export function getCategoryErrorMessage(error) {
  const message = error?.data?.detail ?? error?.message;

  return (
    ERROR_TRANSLATIONS[message] ??
    HTTP_ERROR_MESSAGES[error?.status] ??
    "Unable to process the request. Please try again."
  );
}

const ERROR_TRANSLATIONS = {
  "Tên Category không được để trống": "Please enter a category name.",

  "Tên Category tối đa 255 ký tự":
    "Category name must not exceed 255 characters.",

  "Type không được để trống": "Please select a category type.",

  "Type phải là ARTICLE, RECIPE hoặc POST":
    "Category type must be Article, Recipe, or Post.",

  "Tên Category đã tồn tại trong type này":
    "A category with this name already exists for this type.",

  "Category đang được nội dung sử dụng":
    "This category is in use. Its type cannot be changed.",

  "Cannot update a deleted category": "A deleted category cannot be updated.",

  "Đang xử lý thao tác trước.":
    "Another operation is in progress. Please wait.",
};

const HTTP_ERROR_MESSAGES = {
  400: "Invalid request. Please check the entered values.",
  401: "Please sign in to continue.",
  403: "You do not have permission to manage categories.",
  404: "Category not found.",
  409: "This change conflicts with the current category data.",
};

export function getCategoryFieldErrors(error) {
  return Object.fromEntries(
    Object.entries(error?.data?.errors ?? {}).map(([field, message]) => [
      field,
      ERROR_TRANSLATIONS[message] ?? "Invalid value. Please check this field.",
    ]),
  );
}
