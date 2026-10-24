import { Leaf, Pencil, Trash2 } from "lucide-react";
import { formatIngredientId } from "../../../utils/ingredient";

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
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[650px] border-collapse text-left">
        <caption className="sr-only">Ingredient list</caption>

        <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">
              Ingredient ID
            </th>
            <th scope="col" className="px-4 py-3">
              Name &amp; Description
            </th>
            <th scope="col" className="px-4 py-3">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {ingredients.length === 0 && (
            <tr>
              <td
                colSpan={3}
                className="px-4 py-10 text-center text-sm text-slate-500"
              >
                No matching ingredients found.
              </td>
            </tr>
          )}

          {ingredients.map((ingredient) => (
            <tr
              key={ingredient.ingredientId}
              className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
            >
              <td className="whitespace-nowrap px-4 py-3.5 text-xs font-bold tabular-nums text-emerald-800">
                {formatIngredientId(ingredient.ingredientId)}
              </td>

              <td className="min-w-[260px] max-w-xl px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Leaf aria-hidden="true" size={17} />
                  </span>

                  <div className="min-w-0">
                    <p className="break-words text-xs font-semibold text-slate-900">
                      {ingredient.name}
                    </p>

                    <p className="mt-1 line-clamp-2 break-words text-[11px] leading-5 text-slate-500">
                      {ingredient.description || "No description provided."}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onEdit(ingredient)}
                    aria-label={`Edit ingredient ${ingredient.name}`}
                    className={`${actionClass} bg-emerald-100 text-emerald-800 enabled:hover:bg-emerald-200 focus-visible:outline-emerald-700`}
                  >
                    <Pencil aria-hidden="true" size={12} />
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDelete(ingredient)}
                    aria-label={`Delete ingredient ${ingredient.name}`}
                    className={`${actionClass} bg-red-100 text-red-700 enabled:hover:bg-red-200 focus-visible:outline-red-700`}
                  >
                    <Trash2 aria-hidden="true" size={12} />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
