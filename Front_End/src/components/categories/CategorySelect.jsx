import { useId } from "react";

export default function CategorySelect({
  value,
  categories,
  onChange,
  disabled = false,
}) {
  const id = useId();

  return (
    <>
      <label htmlFor={id} className="sr-only">
        Lọc công thức theo danh mục
      </label>

      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm disabled:opacity-50"
      >
        <option value="">Tất cả danh mục</option>

        {categories.map((category) => (
          <option key={category.categoryId} value={category.categoryId}>
            {category.name}
          </option>
        ))}
      </select>
    </>
  );
}
