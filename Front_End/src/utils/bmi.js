const BMI_CATEGORY_LABELS = {
  UNDERWEIGHT: "Underweight",
  NORMAL: "Normal Weight",
  OVERWEIGHT: "Overweight",
  OBESE: "Obese",
};

export function getBmiCategoryLabel(category) {
  return BMI_CATEGORY_LABELS[category] || "Not calculated";
}

export function formatBmiValue(bmi) {
  if (typeof bmi !== "number" || !Number.isFinite(bmi)) {
    return "—";
  }

  return bmi.toFixed(2);
}
