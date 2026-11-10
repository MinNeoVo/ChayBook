import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Moon,
  Sun,
  Sunrise,
  Utensils,
} from "lucide-react";

import Button from "../common/Button";
import RecipeImage from "../recipes/RecipeImage";

const DAYS_PER_PAGE = 4;
const mealRows = [
  { type: "BREAKFAST", label: "Bữa sáng", Icon: Sunrise },
  { type: "LUNCH", label: "Bữa trưa", Icon: Sun },
  { type: "DINNER", label: "Bữa tối", Icon: Moon },
];
const rowColumns = "grid grid-cols-[6rem_repeat(4,minmax(0,1fr))]";

function nutritionValue(value, round = false) {
  return Number.isFinite(value) ? (round ? Math.round(value) : value) : "—";
}

function MealRecipe({ recipe, navigationState }) {
  if (!recipe) {
    return (
      <div className="flex h-full min-h-72 flex-col items-center justify-center gap-3 px-3 text-center text-gray-500">
        <Utensils aria-hidden="true" className="h-6 w-6 text-gray-400" />
        <p className="text-sm">Chưa có món ăn</p>
      </div>
    );
  }

  const totalMinutes =
    Number.isFinite(recipe.prepTime) || Number.isFinite(recipe.cookTime)
      ? (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)
      : null;

  return (
    <article className="flex h-full min-w-0 flex-col gap-3">
      <RecipeImage
        imageUrl={recipe.imageUrl}
        alt={recipe.name || "Công thức"}
        className="aspect-[4/3] w-full shrink-0 rounded-lg"
      />
      <h4 className="text-sm font-bold leading-5 text-gray-900 [overflow-wrap:anywhere]">
        {recipe.name || "Công thức chưa đặt tên"}
      </h4>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1">
          <Flame aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-orange-500" />
          {nutritionValue(recipe.calories, true)} kcal
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock3 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {totalMinutes ?? "—"} min
        </span>
      </div>
      <dl className="grid grid-cols-3 gap-1.5 rounded-lg bg-chaybook-container/70 p-2 [overflow-wrap:anywhere]">
        {[
          ["Protein", recipe.protein],
          ["Tinh bột", recipe.carbs],
          ["Chất béo", recipe.fat],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[11px] text-gray-600">{label}</dt>
            <dd className="mt-1 text-xs font-semibold tabular-nums text-gray-800">
              {nutritionValue(value)} g
            </dd>
          </div>
        ))}
      </dl>
      {recipe.recipeId != null && (
        <Link
          to={`/recipes/${recipe.recipeId}`}
          state={navigationState}
          aria-label={`Xem công thức: ${recipe.name || "Công thức"}`}
          className="mt-auto inline-flex min-h-9 items-center justify-between gap-2 rounded-md border-t border-gray-100 pt-2 text-xs font-semibold text-chaybook-primary hover:text-chaybook-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chaybook-primary"
        >
          Xem công thức
          <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
        </Link>
      )}
    </article>
  );
}

function MealPlanSchedule({ days, mealPlanId, initialPage = 0, tableRef }) {
  const [page, setPage] = useState(() =>
    Number.isInteger(initialPage) && initialPage >= 0 ? initialPage : 0,
  );
  const scrollRegionRef = useRef(null);
  const totalPages = Math.ceil(days.length / DAYS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const recipeNavigationState = {
    from: "/meal-plan",
    mealPlanId,
    mealPlanPage: currentPage,
  };
  const visibleDays = days.slice(
    currentPage * DAYS_PER_PAGE,
    (currentPage + 1) * DAYS_PER_PAGE,
  );
  const dayColumns = Array.from(
    { length: DAYS_PER_PAGE },
    (_, index) => visibleDays[index] ?? null,
  );

  function changePage(nextPage) {
    setPage(Math.max(0, Math.min(nextPage, totalPages - 1)));
    scrollRegionRef.current?.scrollTo({ left: 0 });
  }

  if (days.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-6 text-sm text-gray-600 shadow-sm">
        Chưa có bữa ăn nào trong thực đơn này.
      </p>
    );
  }

  return (
    <div ref={tableRef} className="min-w-0 max-w-full rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div
        ref={scrollRegionRef}
        role="region"
        aria-label="Lịch thực đơn"
        tabIndex={0}
        className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-t-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chaybook-primary"
      >
        <div role="table" aria-label="Lịch bữa ăn" className="w-full min-w-[52rem]">
          <div role="rowgroup">
            <div role="row" className={`${rowColumns} border-b border-gray-200 bg-chaybook-primary/5`}>
              <div role="columnheader" className="border-r border-gray-200 px-3 py-5 text-sm font-semibold text-gray-600">
                Bữa ăn
              </div>
              {dayColumns.map((day, index) => (
                <div
                  key={day?.[0] ?? `empty-${index}`}
                  role="columnheader"
                  aria-label={day ? undefined : "Không có ngày tiếp theo"}
                  className="min-w-0 border-r border-gray-200 px-4 py-5 text-center text-sm font-bold text-chaybook-primary last:border-r-0"
                >
                  {day ? `Ngày ${day[0]}` : "—"}
                </div>
              ))}
            </div>
          </div>
          <div role="rowgroup">
            {mealRows.map(({ type, label, Icon }) => (
              <div key={type} role="row" className={`${rowColumns} border-b border-gray-200 last:border-b-0`}>
                <div role="rowheader" className="flex min-w-0 flex-col items-start gap-3 border-r border-gray-200 bg-chaybook-container/50 px-3 py-5 text-xs font-semibold text-chaybook-primary">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                  {label}
                </div>
                {dayColumns.map((day, index) => {
                  const meals = day?.[1].filter((item) => item.mealType === type) ?? [];

                  return (
                    <div
                      key={day?.[0] ?? `empty-${index}`}
                      role="cell"
                      aria-label={day ? `Ngày ${day[0]}, ${label}` : "Không có ngày tiếp theo"}
                      className={`min-w-0 border-r border-gray-200 p-3 last:border-r-0 ${day ? "" : "bg-gray-50/70"}`}
                    >
                      {day ? (
                        meals.length > 0 ? (
                          <div className="flex h-full min-w-0 flex-col gap-4">
                            {meals.map((item, mealIndex) => (
                              <MealRecipe key={`${item.recipe?.recipeId ?? "missing"}-${mealIndex}`} recipe={item.recipe} navigationState={recipeNavigationState} />
                            ))}
                          </div>
                        ) : (
                          <MealRecipe />
                        )
                      ) : (
                        <div aria-hidden="true" className="flex h-full min-h-72 items-center justify-center text-gray-300">—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <nav aria-label="Phân trang thực đơn" className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:px-5">
        <p role="status" aria-live="polite" className="text-xs text-gray-600 sm:text-sm">
          Ngày {visibleDays[0][0]}–{visibleDays.at(-1)[0]} / {days.length}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => changePage(currentPage - 1)} className="gap-1 focus-visible:ring-2 focus-visible:ring-chaybook-primary">
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            Trước
          </Button>
          {Array.from({ length: totalPages }, (_, pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              aria-label={`Đến trang thực đơn ${pageNumber + 1}`}
              aria-current={currentPage === pageNumber ? "page" : undefined}
              onClick={() => changePage(pageNumber)}
              className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chaybook-primary ${currentPage === pageNumber ? "border-chaybook-primary bg-chaybook-primary text-white" : "border-gray-200 text-gray-600 hover:bg-chaybook-container"}`}
            >
              {pageNumber + 1}
            </button>
          ))}
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages - 1} onClick={() => changePage(currentPage + 1)} className="gap-1 focus-visible:ring-2 focus-visible:ring-chaybook-primary">
            Sau
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </nav>
    </div>
  );
}

export default MealPlanSchedule;
