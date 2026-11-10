export default function CategoryFilter({
  activeCategoryId,
  categories,
  onCategoryChange,
  disabled = false,
}) {
  const options = [{ categoryId: null, name: "Tất cả" }, ...categories];

  return (
    <div
      role="group"
      aria-label="Lọc bài viết theo danh mục"
      className="flex flex-wrap justify-center gap-2"
    >
      {options.map((category) => {
        const selected =
          category.categoryId === null
            ? activeCategoryId === null
            : Number(activeCategoryId) === Number(category.categoryId);

        return (
          <button
            key={category.categoryId ?? "all"}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onCategoryChange(category.categoryId)}
            className={
              "rounded-full border px-4 py-2 text-sm disabled:opacity-50 " +
              (selected
                ? "border-chaybook-primary bg-chaybook-primary text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-green-50")
            }
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
