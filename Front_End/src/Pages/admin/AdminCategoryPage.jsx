import { useState } from "react";
import Button from "../../components/common/Button";
import CategoryFilters from "../../components/admin/category/CategoryFilters";
import CategoryForm from "../../components/admin/category/CategoryForm";
import CategoryTable from "../../components/admin/category/CategoryTable";
import { useAdminCategories } from "../../hooks/useAdminCategories";
import {
  getCategoryErrorMessage,
  INITIAL_CATEGORY_FILTERS,
} from "../../utils/category";

export default function AdminCategoryPage() {
  const [filters, setFilters] = useState(INITIAL_CATEGORY_FILTERS);
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

  function openEditor(category = null) {
    setEditor({ category });
    setNotice("");
    setActionError("");
  }

  async function save(payload) {
    await saveCategory(editor.category?.categoryId ?? null, payload);

    setEditor(null);
    setNotice("Category saved successfully!");
    setActionError("");
  }

  async function remove(category) {
    const confirmed = window.confirm(
      'Delete category "' +
        category.name +
        '"?\n\nThis action cannot be undone.',
    );

    if (!confirmed) return;

    setActionError("");
    setNotice("");

    try {
      await deleteCategory(category.categoryId);

      if (editor?.category?.categoryId === category.categoryId) {
        setEditor(null);
      }

      setNotice("Category deleted successfully!");
    } catch (requestError) {
      setActionError(getCategoryErrorMessage(requestError));
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Manage Categories
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage categories for articles, recipes, and posts
          </p>
        </div>

        <Button disabled={isMutating} onClick={() => openEditor()}>
          Add Category
        </Button>
      </header>

      {notice && (
        <p role="status" className="text-green-700">
          {notice}
        </p>
      )}

      {actionError && (
        <p role="alert" className="text-red-700">
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

      <CategoryFilters onApply={setFilters} disabled={isMutating} />

      <Button
        variant="outline"
        size="sm"
        onClick={reload}
        disabled={isLoading || isMutating}
      >
        Reload
      </Button>

      {isLoading ? (
        <p role="status">Loading categories...</p>
      ) : error ? (
        <p role="alert" className="text-red-700">
          {getCategoryErrorMessage(error)}
        </p>
      ) : (
        <CategoryTable
          categories={categories}
          busy={isMutating}
          onEdit={openEditor}
          onDelete={remove}
        />
      )}
    </div>
  );
}
