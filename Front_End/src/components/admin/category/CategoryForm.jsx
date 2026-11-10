import { useState } from "react";
import Button from "../../common/Button";
import {
  CATEGORY_TYPES,
  getCategoryErrorMessage,
  getCategoryFieldErrors,
  toCategoryPayload,
  validateCategory,
} from "../../../utils/category";

export default function CategoryForm({ category, busy, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => ({
    name: category?.name ?? "",
    type: category?.type ?? "ARTICLE",
    description: category?.description ?? "",
  }));

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const controlClass = "w-full rounded-xl border border-slate-300 px-3 py-2";

  function change(event) {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));

    setSubmitError("");
  }

  async function submit(event) {
    event.preventDefault();

    if (busy) return;

    const payload = toCategoryPayload(values);
    const nextErrors = validateCategory(payload);

    setErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length) return;

    try {
      await onSubmit(payload);
    } catch (error) {
      setErrors(getCategoryFieldErrors(error));
      setSubmitError(getCategoryErrorMessage(error));
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">
        {category ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
      </h2>

      <form onSubmit={submit} noValidate>
        <fieldset disabled={busy} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span>Tên danh mục *</span>

            <input
              name="name"
              value={values.name}
              maxLength={255}
              onChange={change}
              className={controlClass}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "category-name-error" : undefined}
            />

            {errors.name && (
              <span
                id="category-name-error"
                role="alert"
                className="block text-red-700"
              >
                {errors.name}
              </span>
            )}
          </label>

          <label className="block space-y-1 text-sm">
            <span>Loại *</span>

            <select
              name="type"
              value={values.type}
              onChange={change}
              className={controlClass}
              aria-invalid={Boolean(errors.type)}
              aria-describedby={errors.type ? "category-type-error" : undefined}
            >
              {CATEGORY_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            {errors.type && (
              <span
                id="category-type-error"
                role="alert"
                className="block text-red-700"
              >
                {errors.type}
              </span>
            )}
          </label>

          <label className="block space-y-1 text-sm">
            <span>Mô tả</span>

            <textarea
              name="description"
              rows={3}
              value={values.description}
              onChange={change}
              className={controlClass}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "category-description-error" : undefined
              }
            />

            {errors.description && (
              <span
                id="category-description-error"
                role="alert"
                className="block text-red-700"
              >
                {errors.description}
              </span>
            )}
          </label>

          {submitError && (
            <p role="alert" className="text-red-700">
              {submitError}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit">
              {busy ? "Đang lưu..." : "Lưu danh mục"}
            </Button>

            <Button variant="outline" onClick={onCancel}>
              Hủy
            </Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
