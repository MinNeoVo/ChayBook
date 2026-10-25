import {
  ChefHat,
  FileImage,
  FileText,
  Pencil,
  Tag,
  Trash2,
} from "lucide-react";

import { CATEGORY_TYPES, formatCategoryId } from "../../../utils/category";

const TYPE_ICONS = {
  ARTICLE: FileText,
  RECIPE: ChefHat,
  POST: FileImage,
};

const STATUS_LABELS = {
  ACTIVE: "Đang hoạt động",
  DELETED: "Đã xóa",
};

const actionClass =
  "inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 " +
  "text-[11px] font-semibold transition-colors focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function CategoryTypeBadge({ type }) {
  const Icon = TYPE_ICONS[type] ?? Tag;

  const label =
    CATEGORY_TYPES.find((item) => item.value === type)?.label ?? type;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
      <Icon aria-hidden="true" size={12} />
      {label}
    </span>
  );
}

export default function CategoryTable({ categories, busy, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[900px] table-fixed border-collapse text-left">
        <caption className="sr-only">Danh sách danh mục</caption>
        <colgroup>
          <col className="w-[14%]" />
          <col className="w-[38%]" />
          <col className="w-[14%]" />
          <col className="w-[16%]" />
          <col className="w-[18%]" />
        </colgroup>
        <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <tr className="h-12">
            {[
              "Mã danh mục",
              "Tên & mô tả",
              "Loại",
              "Trạng thái",
              "Thao tác",
            ].map((title) => (
              <th
                key={title}
                scope="col"
                className={`px-4 py-3 ${
                  title === "Thao tác" ? "text-right" : ""
                }`}
              >
                {title}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {categories.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-10 text-center text-sm text-slate-500"
              >
                Không tìm thấy danh mục phù hợp.
              </td>
            </tr>
          )}

          {categories.map((category) => {
            const active = category.status === "ACTIVE";

            return (
              <tr
                key={category.categoryId}
                className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
              >
                <td className="whitespace-nowrap px-4 py-3.5 text-xs font-bold tabular-nums text-emerald-800">
                  {formatCategoryId(category.categoryId)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Tag aria-hidden="true" size={17} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        title={category.name}
                        className="truncate text-xs font-semibold leading-5 text-slate-900"
                      >
                        {category.name}
                      </p>

                      <p
                        title={category.description || undefined}
                        className="mt-1 line-clamp-2 h-10 break-words text-[11px] leading-5 text-slate-500"
                      >
                        {category.description || "Chưa có mô tả."}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <CategoryTypeBadge type={category.type} />
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
                    {STATUS_LABELS[category.status] ?? category.status}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                    <button
                      type="button"
                      disabled={busy || !active}
                      onClick={() => onEdit(category)}
                      aria-label={`Chỉnh sửa danh mục ${category.name}`}
                      className={`${actionClass} bg-emerald-100 text-emerald-800 enabled:hover:bg-emerald-200 focus-visible:outline-emerald-700`}
                    >
                      <Pencil aria-hidden="true" size={12} />
                      Sửa
                    </button>

                    <button
                      type="button"
                      disabled={busy || !active}
                      onClick={() => onDelete(category)}
                      aria-label={`Xóa danh mục ${category.name}`}
                      className={`${actionClass} bg-red-100 text-red-700 enabled:hover:bg-red-200 focus-visible:outline-red-700`}
                    >
                      <Trash2 aria-hidden="true" size={12} />
                      Xóa
                    </button>
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
