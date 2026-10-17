import { useCallback, useState } from "react";
import { Link, Outlet, useNavigate, useOutletContext, useParams } from "react-router-dom";
import AdminRequestState from "../../components/admin/AdminRequestState";
import useAdminResource from "../../hooks/useAdminResource";
import {
  getAdminCategories, getAdminRecipes, getAdminRecipe, getAdminRecipeIngredients,
  createAdminRecipe, updateAdminRecipe, deleteAdminRecipe, resolveAdminMediaUrl,
} from "../../services/adminContentServices";

const FIELD = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50";
const BUTTON = "inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const PANEL = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";
const PAGE_SIZE = 10;

function RecipeImage({ imageUrl, name }) {
  const src = resolveAdminMediaUrl(imageUrl);
  const [failedSource, setFailedSource] = useState(null);
  if (!src || failedSource === src) {
    return <span role="img" aria-label={src ? "Recipe image unavailable" : "No recipe image"}
      className="flex h-24 w-32 shrink-0 items-center justify-center rounded-lg bg-slate-100 p-2 text-center text-xs text-slate-500">
      {src ? "Image unavailable" : "No image"}
    </span>;
  }
  return <img key={src} src={src} alt={name || "Recipe"} className="h-24 w-32 rounded-lg bg-slate-100 object-cover" onError={() => setFailedSource(src)} />;
}

export default function AdminRecipeManagement() {
  const [notice, setNotice] = useState("");
  const load = useCallback((signal) => getAdminCategories("RECIPE", { signal }), []);
  const resource = useAdminResource(load);
  if (resource.loading || resource.error) return <AdminRequestState {...resource} onRetry={resource.retry} />;
  return <div className="mx-auto max-w-[1500px] space-y-5">
    {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-800">{notice}</p>}
    <Outlet context={{ categories: resource.data, setNotice }} />
  </div>;
}

export function AdminRecipeListPage() {
  const { categories } = useOutletContext();
  const [filters, setFilters] = useState({ keyword: "", categoryId: "", status: "", page: 0 });
  const load = useCallback((signal) => getAdminRecipes({ ...filters, size: PAGE_SIZE, signal }).then((data) => {
    if (!signal.aborted && filters.page > Math.max(0, data.totalPages - 1)) {
      setFilters((current) => ({ ...current, page: Math.max(0, data.totalPages - 1) }));
    }
    return data;
  }), [filters]);
  const resource = useAdminResource(load);
  const result = resource.data;
  const changeFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value, page: 0 }));
  return <>
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold text-slate-900">Recipe Management</h1>
      <Link className={BUTTON} to="/admin/recipes/new">Create Recipe</Link>
    </header>
    <section className={`${PANEL} grid gap-3 sm:grid-cols-4`} aria-label="Search and filter recipes">
      <label className="text-sm">Search by name<input className={FIELD} type="search" value={filters.keyword} onChange={(event) => changeFilter("keyword", event.target.value)} /></label>
      <label className="text-sm">Category<select className={FIELD} value={filters.categoryId} onChange={(event) => changeFilter("categoryId", event.target.value)}>
        <option value="">All categories</option>
        {categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.name}{category.status === "DELETED" ? " (deleted)" : ""}</option>)}
      </select></label>
      <label className="text-sm">Status<select className={FIELD} value={filters.status} onChange={(event) => changeFilter("status", event.target.value)}>
        <option value="">All statuses</option><option value="ACTIVE">Active</option><option value="DELETED">Deleted</option>
      </select></label>
      <button type="button" className={`${BUTTON} self-end`} disabled={resource.loading} onClick={resource.retry}>Refresh</button>
    </section>
    <AdminRequestState {...resource} onRetry={resource.retry} />
    {result && <section className={`${PANEL} overflow-x-auto`}>
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b text-slate-500"><th className="p-3">Recipe</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
        <tbody>{result.items.length ? result.items.map((recipe) => <tr className="border-b border-slate-100" key={recipe.recipeId}>
          <td className="p-3"><div className="flex items-center gap-3"><RecipeImage {...recipe} /><span className="font-semibold">#{recipe.recipeId} · {recipe.name}</span></div></td>
          <td className="p-3">{recipe.categoryName || "Uncategorized"}</td><td className="p-3">{recipe.status}</td>
          <td className="p-3"><Link className="font-semibold text-emerald-700 underline" to={`/admin/recipes/${recipe.recipeId}`}>View details</Link></td>
        </tr>) : <tr><td colSpan={4} className="p-10 text-center text-slate-500">No recipes match the current filters.</td></tr>}</tbody>
      </table>
      <nav aria-label="Recipe pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{result.totalElements} recipes · Page {result.totalPages ? filters.page + 1 : 0} of {result.totalPages}</p>
        <div className="flex gap-2">
          <button type="button" className={BUTTON} disabled={resource.loading || filters.page === 0} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Previous</button>
          <button type="button" className={BUTTON} disabled={resource.loading || filters.page + 1 >= result.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</button>
        </div>
      </nav>
    </section>}
  </>;
}

export function AdminRecipeDetailPage() {
  const { recipeId } = useParams();
  const { setNotice } = useOutletContext();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback((signal) => getAdminRecipe(recipeId, { signal }), [recipeId]);
  const resource = useAdminResource(load);
  const recipe = resource.data;
  const remove = async () => {
    if (deleting || !window.confirm(`Delete recipe "${recipe.name}"? It will be marked as deleted.`)) return;
    setDeleting(true);
    setError("");
    try {
      await deleteAdminRecipe(recipeId);
      setNotice("Recipe deleted successfully.");
      navigate("/admin/recipes");
    } catch (requestError) {
      setError(requestError.message);
      setDeleting(false);
    }
  };
  return <>
    <Link to="/admin/recipes" className="text-emerald-700 underline">Back to Recipes</Link>
    <AdminRequestState {...resource} onRetry={resource.retry} />
    <AdminRequestState error={error} />
    {recipe && <>
      <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">{recipe.name}</h1>
        {recipe.status === "ACTIVE" && <div className="flex gap-2">
          <Link className={BUTTON} to={`/admin/recipes/${recipeId}/edit`}>Edit Recipe</Link>
          <button type="button" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={deleting} onClick={remove}>{deleting ? "Deleting…" : "Delete Recipe"}</button>
        </div>}
      </header>
      <article className={`${PANEL} space-y-4`}>
        <RecipeImage {...recipe} />
        <p className="text-sm text-slate-500">#{recipe.recipeId} · {recipe.categoryName || "Uncategorized"} · {recipe.status}</p>
        <p className="whitespace-pre-wrap">{recipe.description}</p>
        <p>Preparation: {recipe.prepTime ?? "—"} min · Cooking: {recipe.cookTime ?? "—"} min · Servings: {recipe.servings ?? "—"} · Difficulty: {recipe.difficulty ?? "—"}</p>
        <p>Calories: {recipe.calories ?? "—"} · Protein: {recipe.protein ?? "—"} · Carbs: {recipe.carbs ?? "—"} · Fat: {recipe.fat ?? "—"}</p>
        <h2 className="font-bold">Ingredients</h2>
        <ul className="list-inside list-disc">{recipe.ingredients?.map((ingredient) => <li key={ingredient.ingredientId}>{ingredient.name}: {ingredient.quantity} {ingredient.unit}</li>)}</ul>
        <h2 className="font-bold">Instructions</h2><p className="whitespace-pre-wrap">{recipe.instructions}</p>
      </article>
    </>}
  </>;
}

export function AdminRecipeCreatePage() {
  return <RecipeForm />;
}

export function AdminRecipeEditPage() {
  const { recipeId } = useParams();
  const load = useCallback((signal) => getAdminRecipe(recipeId, { signal }), [recipeId]);
  const resource = useAdminResource(load);
  if (resource.loading || resource.error) return <AdminRequestState {...resource} onRetry={resource.retry} />;
  if (resource.data.status !== "ACTIVE") return <p role="alert">Deleted recipes cannot be edited. <Link to="/admin/recipes">Back to Recipes</Link></p>;
  return <RecipeForm key={recipeId} recipe={resource.data} />;
}

function initialValues(recipe) {
  return {
    categoryId: String(recipe?.categoryId ?? ""), name: recipe?.name ?? "",
    description: recipe?.description ?? "", imageUrl: recipe?.imageUrl ?? "",
    prepTime: String(recipe?.prepTime ?? 0), cookTime: String(recipe?.cookTime ?? 0),
    instructions: recipe?.instructions ?? "",
    ingredients: recipe?.ingredients?.map((item) => ({ ingredientId: String(item.ingredientId), quantity: String(item.quantity), unit: item.unit })) ?? [{ ingredientId: "", quantity: "", unit: "" }],
  };
}

function RecipeForm({ recipe }) {
  const { categories, setNotice } = useOutletContext();
  const navigate = useNavigate();
  const [original] = useState(() => initialValues(recipe));
  const [values, setValues] = useState(original);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback((signal) => getAdminRecipeIngredients({ signal }), []);
  const ingredients = useAdminResource(load);
  const change = (field, value) => setValues((current) => ({ ...current, [field]: value }));
  const changeIngredient = (index, field, value) => setValues((current) => ({
    ...current, ingredients: current.ingredients.map((item, position) => position === index ? { ...item, [field]: value } : item),
  }));
  const cancel = () => {
    if (saving) return;
    if (JSON.stringify(values) !== JSON.stringify(original) && !window.confirm("Discard your unsaved changes?")) return;
    navigate(recipe ? `/admin/recipes/${recipe.recipeId}` : "/admin/recipes");
  };
  const submit = async (event) => {
    event.preventDefault();
    if (saving || ingredients.loading || ingredients.error) return;
    setError("");
    const ids = values.ingredients.map((item) => Number(item.ingredientId));
    if (new Set(ids).size !== ids.length) { setError("Choose each ingredient only once."); return; }
    if (!values.name.trim() || !values.instructions.trim() || values.ingredients.some((item) => !item.unit.trim() || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) {
      setError("Enter a name, instructions, and valid ingredient quantities and units."); return;
    }
    const body = {
      ...values, name: values.name.trim(), categoryId: Number(values.categoryId),
      prepTime: Number(values.prepTime), cookTime: Number(values.cookTime),
      ingredients: values.ingredients.map((item) => ({ ingredientId: Number(item.ingredientId), quantity: Number(item.quantity), unit: item.unit.trim() })),
    };
    setSaving(true);
    try {
      const saved = recipe ? await updateAdminRecipe(recipe.recipeId, body) : await createAdminRecipe(body);
      setNotice(recipe ? "Recipe updated successfully." : "Recipe created successfully.");
      navigate(`/admin/recipes/${saved.recipeId}`);
    } catch (requestError) {
      const fields = Object.values(requestError.data?.errors || {}).join("; ");
      setError(fields || requestError.message);
      setSaving(false);
    }
  };
  return <>
    <h1 className="text-2xl font-bold">{recipe ? "Edit Recipe" : "Create Recipe"}</h1>
    <AdminRequestState {...ingredients} onRetry={ingredients.retry} />
    <form onSubmit={submit} className={`${PANEL} space-y-5`}>
      <AdminRequestState error={error} />
      <fieldset disabled={saving} className="space-y-4">
        <label className="block text-sm font-medium">Recipe name *<input className={FIELD} required maxLength={255} value={values.name} onChange={(event) => change("name", event.target.value)} /></label>
        <label className="block text-sm font-medium">Category *<select className={FIELD} required value={values.categoryId} onChange={(event) => change("categoryId", event.target.value)}>
          <option value="">Choose category</option>
          {categories.filter((category) => category.status === "ACTIVE" || String(category.categoryId) === original.categoryId).map((category) => <option key={category.categoryId} value={category.categoryId}>{category.name}{category.status === "DELETED" ? " (deleted)" : ""}</option>)}
        </select></label>
        <label className="block text-sm font-medium">Description<textarea className={FIELD} rows={3} value={values.description} onChange={(event) => change("description", event.target.value)} /></label>
        <label className="block text-sm font-medium">Image URL<input className={FIELD} maxLength={255} value={values.imageUrl} onChange={(event) => change("imageUrl", event.target.value)} placeholder="Image URL or server path" /></label>
        <RecipeImage imageUrl={values.imageUrl} name={values.name} />
        <div className="grid gap-4 sm:grid-cols-2">{[["prepTime", "Preparation time (minutes)"], ["cookTime", "Cooking time (minutes)"]].map(([field, label]) => <label key={field} className="text-sm font-medium">{label} *<input className={FIELD} type="number" min={0} max={2147483647} step={1} required value={values[field]} onChange={(event) => change(field, event.target.value)} /></label>)}</div>
        <label className="block text-sm font-medium">Instructions *<textarea className={FIELD} rows={7} required value={values.instructions} onChange={(event) => change("instructions", event.target.value)} /></label>
        <h2 className="font-bold">Ingredients *</h2>
        {values.ingredients.map((item, index) => <div key={index} className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <label className="text-sm">Ingredient<select className={FIELD} required value={item.ingredientId} onChange={(event) => changeIngredient(index, "ingredientId", event.target.value)}>
            <option value="">Choose ingredient</option>{(ingredients.data || []).map((choice) => <option key={choice.ingredientId} value={choice.ingredientId}>{choice.name}</option>)}
          </select></label>
          <label className="text-sm">Quantity<input className={FIELD} type="number" min="0.000001" step="any" required value={item.quantity} onChange={(event) => changeIngredient(index, "quantity", event.target.value)} /></label>
          <label className="text-sm">Unit<input className={FIELD} required maxLength={50} value={item.unit} onChange={(event) => changeIngredient(index, "unit", event.target.value)} /></label>
          <button type="button" className="self-end rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50" disabled={values.ingredients.length === 1} onClick={() => change("ingredients", values.ingredients.filter((_, position) => index !== position))}>Remove</button>
        </div>)}
        <button type="button" className={BUTTON} onClick={() => change("ingredients", [...values.ingredients, { ingredientId: "", quantity: "", unit: "" }])}>Add ingredient</button>
      </fieldset>
      <div className="flex gap-3"><button className={BUTTON} type="submit" disabled={saving || ingredients.loading || Boolean(ingredients.error)}>{saving ? "Saving…" : "Save Recipe"}</button><button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm" disabled={saving} onClick={cancel}>Cancel</button></div>
    </form>
  </>;
}
