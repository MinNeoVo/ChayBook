import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../common/Button";

function getPageItems(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const start = Math.max(1, Math.min(page - 1, totalPages - 4));
  const middle = [start, start + 1, start + 2];

  return [
    0,
    ...(start > 1 ? ["start-gap"] : []),
    ...middle,
    ...(start + 2 < totalPages - 2 ? ["end-gap"] : []),
    totalPages - 1,
  ];
}

function RecipePagination({ page, size, totalPages, totalElements, onPageChange }) {
  if (totalPages <= 1 || totalElements === 0) {
    return null;
  }

  const firstRecipe = page * size + 1;
  const lastRecipe = Math.min((page + 1) * size, totalElements);
  const buttonClass =
    "min-h-10 min-w-9 sm:min-w-10 rounded-xl border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chaybook-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <nav
      aria-label="Phân trang công thức"
      className="mt-8 flex flex-col items-center gap-4 border-t border-gray-200/80 pt-6"
    >
      <p role="status" className="text-center text-sm text-[#3e4a3d]">
        Hiển thị {firstRecipe}–{lastRecipe} / {totalElements} công thức
      </p>
      <div className="flex w-full flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chaybook-primary focus-visible:ring-offset-2"
        >
          <ChevronLeft aria-hidden="true" size={16} />
          Trước
        </Button>
        <div className="flex items-center gap-1 sm:gap-2">
          {getPageItems(page, totalPages).map((item) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                aria-label={`Đến trang ${item + 1}`}
                aria-current={item === page ? "page" : undefined}
                disabled={item === page}
                onClick={() => onPageChange(item)}
                className={`${buttonClass} ${
                  item === page
                    ? "border-chaybook-primary bg-chaybook-primary text-white disabled:opacity-100"
                    : "border-gray-200 bg-white text-chaybook-primary hover:border-chaybook-primary hover:bg-chaybook-primary/10"
                }`}
              >
                {item + 1}
              </button>
            ) : (
              <span key={item} aria-hidden="true" className="px-1 text-gray-500">
                …
              </span>
            ),
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chaybook-primary focus-visible:ring-offset-2"
        >
          Sau
          <ChevronRight aria-hidden="true" size={16} />
        </Button>
      </div>
    </nav>
  );
}

export default RecipePagination;
