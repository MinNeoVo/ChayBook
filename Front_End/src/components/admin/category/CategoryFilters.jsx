import { useState } from "react";
import Button from "../../common/Button";
import {
  CATEGORY_TYPES,
  INITIAL_CATEGORY_FILTERS,
} from "../../../utils/category";

export default function CategoryFilters({ onApply, disabled }) {
  const [draft, setDraft] = useState(INITIAL_CATEGORY_FILTERS);

  const controlClass =
    "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

  function update(event) {
    const { name, value } = event.target;

    setDraft((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function submit(event) {
    event.preventDefault();

    onApply({
      ...draft,
      q: draft.q.trim(),
    });
  }

  function reset() {
    setDraft(INITIAL_CATEGORY_FILTERS);
    onApply(INITIAL_CATEGORY_FILTERS);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <fieldset disabled={disabled} className="flex flex-wrap items-end gap-3">
        <legend className="sr-only">Lọc danh mục</legend>

        <label className="grid min-w-0 flex-1 basis-60 gap-1 text-sm text-slate-700">
          Tìm theo tên
          <input
            name="q"
            type="search"
            value={draft.q}
            onChange={update}
            className={controlClass}
            placeholder="Tìm danh mục..."
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-700">
          Loại
          <select
            name="type"
            value={draft.type}
            onChange={update}
            className={controlClass}
          >
            <option value="">Tất cả loại</option>

            {CATEGORY_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm text-slate-700">
          Trạng thái
          <select
            name="status"
            value={draft.status}
            onChange={update}
            className={controlClass}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="DELETED">Đã xóa</option>
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
