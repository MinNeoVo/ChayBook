import { Leaf, Pencil, Trash2, Undo2 } from "lucide-react";
import {
  formatIngredientId,
  INGREDIENT_STATUS_LABELS,
} from "../../../utils/ingredient";

const actionClass =
  "inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 " +
  "text-[11px] font-semibold transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export default function IngredientTable({
  ingredients,
  busy,
  onEdit,
  onDelete,
  onRestore,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[900px] table-fixed border-collapse text-left">
        <caption className="sr-only">Danh sách nguyên liệu</caption>

        <colgroup>
          <col className="w-[14%]" />
          <col className="w-[52%]" />
          <col className="w-[16%]" />
          <col className="w-[18%]" />
        </colgroup>

        <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <tr className="h-12">
            {["Mã nguyên liệu", "Tên & mô tả", "Trạng thái", "Thao tác"].map(
              (title) => (
                <th
                  key={title}
                  scope="col"
                  className={`px-4 py-3 ${
                    title === "Thao tác" ? "text-right" : ""
                  }`}
                >
                  {title}
                </th>
              ),
            )}
          </tr>
        </thead>

        <tbody>
          {ingredients.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-10 text-center text-sm text-slate-500"
              >
                Không tìm thấy nguyên liệu phù hợp.
              </td>
            </tr>
          )}

          {ingredients.map((ingredient) => {
            const active = ingredient.status === "ACTIVE";
            const deleted = ingredient.status === "DELETED";

            return (
              <tr
                key={ingredient.ingredientId}
                className="h-[104px] border-t border-slate-100 transition-colors hover:bg-slate-50/70"
              >
                <td className="whitespace-nowrap px-4 py-3.5 text-xs font-bold tabular-nums text-emerald-800">
                  {formatIngredientId(ingredient.ingredientId)}
                </td>

                <td className="px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Leaf aria-hidden="true" size={17} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        title={ingredient.name}
                        className="truncate text-xs font-semibold leading-5 text-slate-900"
                      >
                        {ingredient.name}
                      </p>

                      <p
                        title={ingredient.description || undefined}
                        className="mt-1 line-clamp-2 h-10 break-words text-[11px] leading-5 text-slate-500"
                      >
                        {ingredient.description || "Chưa có mô tả."}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-3.5">
                  <span
                    className={
                      "inline-flex rounded-full px-2 py-1 text-[10px] font-semibold " +
                      (active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600")
                    }
                  >
                    {INGREDIENT_STATUS_LABELS[ingredient.status] ??
                      "Không xác định"}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                    {deleted ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onRestore(ingredient)}
                        aria-label={`Hoàn tác xóa nguyên liệu ${ingredient.name}`}
                        className={`${actionClass} bg-amber-100 text-amber-800 enabled:hover:bg-amber-200 focus-visible:outline-amber-700`}
                      >
                        <Undo2 aria-hidden="true" size={12} />
                        Hoàn tác
                      </button>
                    ) : active ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onEdit(ingredient)}
                          aria-label={`Chỉnh sửa nguyên liệu ${ingredient.name}`}
                          className={`${actionClass} bg-emerald-100 text-emerald-800 enabled:hover:bg-emerald-200 focus-visible:outline-emerald-700`}
                        >
                          <Pencil aria-hidden="true" size={12} />
                          Sửa
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onDelete(ingredient)}
                          aria-label={`Xóa nguyên liệu ${ingredient.name}`}
                          className={`${actionClass} bg-red-100 text-red-700 enabled:hover:bg-red-200 focus-visible:outline-red-700`}
                        >
                          <Trash2 aria-hidden="true" size={12} />
                          Xóa
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
