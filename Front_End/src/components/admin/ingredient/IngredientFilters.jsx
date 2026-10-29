import { useState } from "react";
import Button from "../../common/Button";
import {
  INITIAL_INGREDIENT_FILTERS,
  INGREDIENT_STATUS_LABELS,
} from "../../../utils/ingredient";

export default function IngredientFilters({ onApply, disabled }) {
  const [draft, setDraft] = useState(INITIAL_INGREDIENT_FILTERS);

  const controlClass =
    "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

  function change(event) {
    const { name, value } = event.target;

    setDraft((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function submit(event) {
    event.preventDefault();

    onApply({
      q: draft.q.trim(),
      status: draft.status,
      page: 0,
      size: INITIAL_INGREDIENT_FILTERS.size,
    });
  }

  function reset() {
    setDraft(INITIAL_INGREDIENT_FILTERS);
    onApply(INITIAL_INGREDIENT_FILTERS);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <fieldset disabled={disabled} className="flex flex-wrap items-end gap-3">
        <legend className="sr-only">Lọc nguyên liệu</legend>

        <label className="grid min-w-0 flex-1 basis-60 gap-1 text-sm text-slate-700">
          Tìm theo tên
          <input
            name="q"
            type="search"
            value={draft.q}
            maxLength={255}
            onChange={change}
            placeholder="Tìm nguyên liệu..."
            className={controlClass}
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-700">
          Trạng thái
          <select
            name="status"
            value={draft.status}
            onChange={change}
            className={`${controlClass} min-w-[170px]`}
          >
            <option value="">Tất cả trạng thái</option>

            {Object.entries(INGREDIENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <Button type="submit" size="sm" className="h-10 shrink-0">
          Áp dụng
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={reset}
          className="h-10 shrink-0"
        >
          Đặt lại
        </Button>
      </fieldset>
    </form>
  );
}
