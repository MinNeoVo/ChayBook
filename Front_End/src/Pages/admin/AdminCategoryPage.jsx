import { useState } from "react";
import { Plus, Tags } from "lucide-react";
import Button from "../../components/common/Button";
import CategoryFilters from "../../components/admin/category/CategoryFilters";
import CategoryForm from "../../components/admin/category/CategoryForm";
import CategoryTable from "../../components/admin/category/CategoryTable";
import { useAdminCategories } from "../../hooks/useAdminCategories";
import {
  getCategoryErrorMessage,
  INITIAL_CATEGORY_FILTERS,
} from "../../utils/category";

const PAGE_SIZE = 10;

export default function AdminCategoryPage() {
  const [filters, setFilters] = useState(INITIAL_CATEGORY_FILTERS);
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  const {
    categories,
    error,
    isLoading,
    isMutating,
    reload,
    saveCategory,
    deleteCategory,
  } = useAdminCategories(filters);

  const controlsDisabled = isMutating || editor !== null;

  const totalElements = categories.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const startIndex = currentPage * PAGE_SIZE;

  const visibleCategories = categories.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  function openEditor(category = null) {
    setEditor({ category });
    setNotice("");
    setActionError("");
  }

  function applyFilters(nextFilters) {
    setFilters(nextFilters);
    setPage(0);
    setNotice("");
    setActionError("");
  }

  async function save(payload) {
    const categoryId = editor.category?.categoryId ?? null;

    await saveCategory(categoryId, payload);

    setEditor(null);
    setPage(0);
    setNotice("Lưu danh mục thành công!");
    setActionError("");
  }

  async function remove(category) {
    const confirmed = window.confirm(
      `Xóa danh mục "${category.name}"?\n\n` +
        "Danh mục sẽ được chuyển sang trạng thái Đã xóa.",
    );

    if (!confirmed) return;

    setNotice("");
    setActionError("");

    try {
      await deleteCategory(category.categoryId);

      setPage(0);
      setNotice("Đã chuyển danh mục sang trạng thái Đã xóa.");
    } catch (requestError) {
      setActionError(getCategoryErrorMessage(requestError));
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Tags aria-hidden="true" size={22} />
          </span>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Quản lý danh mục
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Quản lý danh mục bài viết, công thức và bài đăng.
            </p>
          </div>
        </div>

        <Button
          disabled={controlsDisabled}
          onClick={() => openEditor()}
          className="gap-2"
        >
          <Plus aria-hidden="true" size={17} />
          Thêm danh mục
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
        <CategoryForm
          key={editor.category?.categoryId ?? "new"}
          category={editor.category}
          busy={isMutating}
          onSubmit={save}
          onCancel={() => setEditor(null)}
        />
      )}

      <CategoryFilters onApply={applyFilters} disabled={controlsDisabled} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Danh mục đã xóa vẫn xuất hiện khi xem tất cả trạng thái.
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
          Đang tải danh mục...
        </p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-700">
          {getCategoryErrorMessage(error)}
        </p>
      ) : (
        <>
          <CategoryTable
            categories={visibleCategories}
            busy={controlsDisabled}
            onEdit={openEditor}
            onDelete={remove}
          />

          <nav
            aria-label="Phân trang danh mục"
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-sm text-slate-500">
              Tổng {totalElements} danh mục
              {" · "}
              Trang {currentPage + 1}/{totalPages}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={controlsDisabled || currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                Trước
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={controlsDisabled || currentPage >= totalPages - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                Sau
              </Button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
