import { useState } from "react";
import Button from "../../common/Button";
import { INITIAL_INGREDIENT_FILTERS } from "../../../utils/ingredient";

export default function IngredientFilters({ onApply, disabled }) {
  const [keyword, setKeyword] = useState("");
  const [size, setSize] = useState(INITIAL_INGREDIENT_FILTERS.size);

  const controlClass =
    "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";

  function submit(event) {
    event.preventDefault();

    onApply({
      q: keyword.trim(),
      size,
    });
  }

  function reset() {
    setKeyword("");
    setSize(INITIAL_INGREDIENT_FILTERS.size);

    onApply({
      q: "",
      size: INITIAL_INGREDIENT_FILTERS.size,
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <fieldset disabled={disabled} className="flex flex-wrap items-end gap-3">
        <legend className="sr-only">Ingredient filters</legend>

        <label className="grid gap-1 text-sm text-slate-700">
          Search by name
          <input
            type="search"
            value={keyword}
            maxLength={255}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search ingredients..."
            className={controlClass}
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-700">
          Rows per page
          <select
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
            className={controlClass}
          >
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </label>

        <Button type="submit" size="sm">
          Apply
        </Button>

        <Button type="button" variant="outline" size="sm" onClick={reset}>
          Reset
        </Button>
      </fieldset>
    </form>
  );
}
