import { useState } from "react";
import { Leaf, Plus } from "lucide-react";
import Button from "../../components/common/Button";
import IngredientFilters from "../../components/admin/ingredient/IngredientFilters";
import IngredientForm from "../../components/admin/ingredient/IngredientForm";
import IngredientTable from "../../components/admin/ingredient/IngredientTable";
import { useAdminIngredients } from "../../hooks/useAdminIngredients";
import {
  getIngredientErrorMessage,
  INITIAL_INGREDIENT_FILTERS,
} from "../../utils/ingredient";

export default function AdminIngredientPage() {
  const [filters, setFilters] = useState(INITIAL_INGREDIENT_FILTERS);
  const [editor, setEditor] = useState(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  const {
    pageData,
    error,
    isLoading,
    isMutating,
    reload,
    saveIngredient,
    deleteIngredient,
  } = useAdminIngredients(filters);

  const controlsDisabled = isMutating || editor !== null;

  function openEditor(ingredient = null) {
    setEditor({ ingredient });
    setNotice("");
    setActionError("");
  }

  function applyFilters(nextFilters) {
    setFilters({
      ...nextFilters,
      page: 0,
    });

    setNotice("");
    setActionError("");
  }

  function changePage(nextPage) {
    setFilters((current) => ({
      ...current,
      page: nextPage,
    }));
  }

  async function save(payload) {
    const ingredientId = editor.ingredient?.ingredientId ?? null;

    await saveIngredient(ingredientId, payload);

    setEditor(null);
    setFilters((current) => ({
      ...current,
      page: 0,
    }));
    setNotice("Ingredient saved successfully!");
    setActionError("");
  }

  async function remove(ingredient) {
    const confirmed = window.confirm(
      `Delete ingredient "${ingredient.name}"?\n\n` +
        "This action cannot be undone. If the ingredient is used in any recipe, allergy group, or AI, it will not be deleted.",
    );

    if (!confirmed) return;

    setNotice("");
    setActionError("");

    try {
      await deleteIngredient(ingredient.ingredientId);

      setFilters((current) => ({
        ...current,
        page: 0,
      }));

      setNotice("Ingredient deleted successfully!");
    } catch (requestError) {
      setActionError(getIngredientErrorMessage(requestError));
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Leaf aria-hidden="true" size={22} />
          </span>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Manage Ingredients
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Browse, add, edit, and delete ingredients used in Chaybook.
            </p>
          </div>
        </div>

        <Button
          disabled={controlsDisabled}
          onClick={() => openEditor()}
          className="gap-2"
        >
          <Plus aria-hidden="true" size={17} />
          Add Ingredient
        </Button>
      </header>

      {notice && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}

      {actionError && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      {editor && (
        <IngredientForm
          key={editor.ingredient?.ingredientId ?? "new"}
          ingredient={editor.ingredient}
          busy={isMutating}
          onSubmit={save}
          onCancel={() => setEditor(null)}
        />
      )}

      <IngredientFilters onApply={applyFilters} disabled={controlsDisabled} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Only ingredients not referenced by recipes, allergy groups, or AI
          results can be deleted.
        </p>

        <Button
          variant="outline"
          size="sm"
          onClick={reload}
          disabled={isLoading || controlsDisabled}
        >
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <p role="status" className="text-sm text-slate-500">
          Loading...
        </p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-700">
          {getIngredientErrorMessage(error)}
        </p>
      ) : pageData ? (
        <>
          <IngredientTable
            ingredients={pageData.content}
            busy={controlsDisabled}
            onEdit={openEditor}
            onDelete={remove}
          />

          <nav
            aria-label="Ingredient pagination"
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-sm text-slate-500">
              Total {pageData.totalElements}
              {" · "}
              Page {pageData.number + 1}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={controlsDisabled || filters.page === 0}
                onClick={() => changePage(filters.page - 1)}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={
                  controlsDisabled || filters.page >= pageData.totalPages - 1
                }
                onClick={() => changePage(filters.page + 1)}
              >
                Next
              </Button>
            </div>
          </nav>
        </>
      ) : null}
    </div>
  );
}
