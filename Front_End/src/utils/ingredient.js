export const INITIAL_INGREDIENT_FILTERS = {
  q: "",
  page: 0,
  size: 10,
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
    errors.name = "Please enter the ingredient name.";
  } else if (payload.name.length > 255) {
    errors.name = "Ingredient name must not exceed 255 characters.";
  }

  if (payload.description?.length > 5000) {
    errors.description = "Description must not exceed 5000 characters.";
  }

  return errors;
}

export function getIngredientErrorMessage(error) {
  const messages = {
    401: "Your session is invalid. Please log in again.",
    403: "You do not have permission to perform this action.",
    404: "This ingredient no longer exists. Please refresh the page.",
  };

  if (messages[error?.status]) {
    return messages[error.status];
  }

  if (error?.status >= 500) {
    return "The server is currently unavailable. Please try again later.";
  }

  return (
    error?.data?.detail ||
    error?.message ||
    "Unable to perform this action. Please try again later."
  );
}
