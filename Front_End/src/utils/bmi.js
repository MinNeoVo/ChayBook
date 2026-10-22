const BMI_CATEGORY_LABELS = {
  UNDERWEIGHT: "Thiếu cân",
  NORMAL: "Cân nặng bình thường",
  OVERWEIGHT: "Thừa cân",
  OBESE: "Béo phì",
};

export function getBmiCategoryLabel(category) {
  return BMI_CATEGORY_LABELS[category] || "Chưa có kết quả";
}

export function formatBmiValue(bmi) {
  if (typeof bmi !== "number" || !Number.isFinite(bmi)) {
    return "—";
  }

  return bmi.toFixed(2);
}
