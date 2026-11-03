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
    restoreIngredient,
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
      size: INITIAL_INGREDIENT_FILTERS.size,
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
    setNotice("Lưu nguyên liệu thành công!");
    setActionError("");
  }

  async function remove(ingredient) {
    const confirmed = window.confirm(
      `Xóa nguyên liệu "${ingredient.name}"?\n\n` +
        "Nguyên liệu sẽ chuyển sang trạng thái 'Đã xóa'. Bạn có thể hoàn tác sau.",
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

      setNotice("Xóa nguyên liệu thành công!");
    } catch (requestError) {
      setActionError(getIngredientErrorMessage(requestError));
    }
  }

  async function restore(ingredient) {
    setNotice("");
    setActionError("");

    try {
      await restoreIngredient(ingredient.ingredientId);

      setFilters((current) => ({
        ...current,
        page: 0,
      }));

      setNotice(`Đã hoàn tác xóa nguyên liệu "${ingredient.name}".`);
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
              Quản lý nguyên liệu
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Tra cứu, bổ sung và cập nhật nguyên liệu của ChayBook.
            </p>
          </div>
        </div>

        <Button
          disabled={controlsDisabled}
          onClick={() => openEditor()}
          className="gap-2"
        >
          <Plus aria-hidden="true" size={17} />
          Thêm nguyên liệu
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
          Chỉ xóa nguyên liệu chưa được công thức, nhóm dị ứng hoặc AI sử dụng.
        </p>

        <Button
          variant="outline"
          size="sm"
          onClick={reload}
          disabled={isLoading || controlsDisabled}
        >
          Tải lại
        </Button>
      </div>

      {isLoading ? (
        <p role="status" className="text-sm text-slate-500">
          Đang tải nguyên liệu...
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
            onRestore={restore}
          />

          <nav
            aria-label="Phân trang nguyên liệu"
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-sm text-slate-500">
              Tổng {pageData.totalElements} nguyên liệu
              {" · "}
              Trang {pageData.number + 1}/{Math.max(1, pageData.totalPages)}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={controlsDisabled || filters.page === 0}
                onClick={() => changePage(filters.page - 1)}
              >
                Trước
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={
                  controlsDisabled || filters.page >= pageData.totalPages - 1
                }
                onClick={() => changePage(filters.page + 1)}
              >
                Sau
              </Button>
            </div>
          </nav>
        </>
      ) : null}
    </div>
  );
}
