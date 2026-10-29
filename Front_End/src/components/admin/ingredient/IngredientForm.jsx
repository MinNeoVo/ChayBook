import { useState } from "react";
import Button from "../../common/Button";
import {
  getIngredientErrorMessage,
  toIngredientPayload,
  validateIngredient,
} from "../../../utils/ingredient";

export default function IngredientForm({
  ingredient,
  busy,
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState(() => ({
    name: ingredient?.name ?? "",
    description: ingredient?.description ?? "",
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

    const payload = toIngredientPayload(values);
    const nextErrors = validateIngredient(payload);

    setErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) return;

    try {
      await onSubmit(payload);
    } catch (error) {
      setErrors(error?.data?.errors ?? {});
      setSubmitError(getIngredientErrorMessage(error));
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        {ingredient ? "Chỉnh sửa nguyên liệu" : "Thêm nguyên liệu mới"}
      </h2>

      <form onSubmit={submit} noValidate>
        <fieldset disabled={busy} className="space-y-4">
          <legend className="sr-only">Thông tin nguyên liệu</legend>

          <label className="block space-y-1 text-sm">
            <span>Tên nguyên liệu *</span>

            <input
              name="name"
              value={values.name}
              onChange={change}
              maxLength={255}
              required
              className={controlClass}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? "ingredient-name-error" : undefined
              }
            />

            {errors.name && (
              <span
                id="ingredient-name-error"
                role="alert"
                className="block text-red-700"
              >
                {errors.name}
              </span>
            )}
          </label>

          <label className="block space-y-1 text-sm">
            <span>Mô tả</span>

            <textarea
              name="description"
              value={values.description}
              onChange={change}
              rows={4}
              maxLength={5000}
              className={controlClass}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "ingredient-description-error" : undefined
              }
            />

            {errors.description && (
              <span
                id="ingredient-description-error"
                role="alert"
                className="block text-red-700"
              >
                {errors.description}
              </span>
            )}
          </label>

          {submitError && (
            <p role="alert" className="text-sm text-red-700">
              {submitError}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit">
              {busy ? "Đang lưu" : "Lưu nguyên liệu"}
            </Button>

            <Button type="button" variant="outline" onClick={onCancel}>
              Hủy
            </Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
