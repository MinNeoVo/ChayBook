import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate, useOutletContext, useParams } from "react-router-dom";
import AdminRequestState from "../../components/admin/AdminRequestState";
import useAdminResource from "../../hooks/useAdminResource";
import { uploadMedia } from "../../services/postServices";
import {
  getAdminCategories, getAdminRecipes, getAdminRecipe, getAdminRecipeIngredients,
  createAdminRecipe, updateAdminRecipe, deleteAdminRecipe, resolveAdminMediaUrl,
} from "../../services/adminContentServices";

const FIELD = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50";
const BUTTON = "inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const PANEL = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";
const PAGE_SIZE = 10;
const MAX_IMAGE_SIZE = 50 * 1024 * 1024;
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const DIFFICULTY_LABELS = { Easy: "Dễ", Medium: "Trung bình", Hard: "Khó" };
const NUTRITION_FIELDS = [
  ["calories", "Calo", "kcal"],
  ["protein", "Protein", "g"],
  ["carbs", "Tinh bột", "g"],
  ["fat", "Chất béo", "g"],
];

function validateAdditionalFields(values, originalDifficulty) {
  const errors = {};
  if (!values.servings.trim() || !Number.isSafeInteger(Number(values.servings)) || Number(values.servings) < 1 || Number(values.servings) > 2147483647) {
    errors.servings = "Số khẩu phần phải là số nguyên từ 1 trở lên.";
  }
  if (!DIFFICULTIES.includes(values.difficulty) && !(originalDifficulty && values.difficulty === originalDifficulty)) {
    errors.difficulty = "Vui lòng chọn mức độ dễ, trung bình hoặc khó.";
  }
  NUTRITION_FIELDS.forEach(([field, label, unit]) => {
    if (values[field].trim() && (!Number.isFinite(Number(values[field])) || Number(values[field]) < 0)) {
      errors[field] = `${label} phải là số hợp lệ từ 0 ${unit} trở lên.`;
    }
  });
  return errors;
}

function RecipeImage({ imageUrl, name }) {
  const src = resolveAdminMediaUrl(imageUrl);
  const [failedSource, setFailedSource] = useState(null);
  if (!src || failedSource === src) {
    return <span role="img" aria-label={src ? "Không tải được ảnh công thức" : "Chưa có ảnh công thức"}
      className="flex h-24 w-32 shrink-0 items-center justify-center rounded-lg bg-slate-100 p-2 text-center text-xs text-slate-500">
      {src ? "Không tải được ảnh" : "Chưa có ảnh"}
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
      <h1 className="text-2xl font-bold text-slate-900">Quản lý công thức</h1>
      <Link className={BUTTON} to="/admin/recipes/new">Tạo công thức</Link>
    </header>
    <section className={`${PANEL} grid gap-3 sm:grid-cols-4`} aria-label="Tìm kiếm và lọc công thức">
      <label className="text-sm">Tìm theo tên<input className={FIELD} type="search" value={filters.keyword} onChange={(event) => changeFilter("keyword", event.target.value)} /></label>
      <label className="text-sm">Danh mục<select className={FIELD} value={filters.categoryId} onChange={(event) => changeFilter("categoryId", event.target.value)}>
        <option value="">Tất cả danh mục</option>
        {categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.name}{category.status === "DELETED" ? " (đã xóa)" : ""}</option>)}
      </select></label>
      <label className="text-sm">Trạng thái<select className={FIELD} value={filters.status} onChange={(event) => changeFilter("status", event.target.value)}>
        <option value="">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="DELETED">Đã xóa</option>
      </select></label>
      <button type="button" className={`${BUTTON} self-end`} disabled={resource.loading} onClick={resource.retry}>Làm mới</button>
    </section>
    <AdminRequestState {...resource} onRetry={resource.retry} />
    {result && <section className={`${PANEL} overflow-x-auto`}>
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b text-slate-500"><th className="p-3">Công thức</th><th className="p-3">Danh mục</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th></tr></thead>
        <tbody>{result.items.length ? result.items.map((recipe) => <tr className="border-b border-slate-100" key={recipe.recipeId}>
          <td className="p-3"><div className="flex items-center gap-3"><RecipeImage {...recipe} /><span className="font-semibold">#{recipe.recipeId} · {recipe.name}</span></div></td>
          <td className="p-3">{recipe.categoryName || "Chưa phân loại"}</td><td className="p-3">{recipe.status === "ACTIVE" ? "Đang hoạt động" : recipe.status === "DELETED" ? "Đã xóa" : recipe.status}</td>
          <td className="p-3"><Link className="font-semibold text-emerald-700 underline" to={`/admin/recipes/${recipe.recipeId}`}>Xem chi tiết</Link></td>
        </tr>) : <tr><td colSpan={4} className="p-10 text-center text-slate-500">Không có công thức nào phù hợp với bộ lọc hiện tại.</td></tr>}</tbody>
      </table>
      <nav aria-label="Phân trang công thức" className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{result.totalElements} công thức · Trang {result.totalPages ? filters.page + 1 : 0} / {result.totalPages}</p>
        <div className="flex gap-2">
          <button type="button" className={BUTTON} disabled={resource.loading || filters.page === 0} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Trước</button>
          <button type="button" className={BUTTON} disabled={resource.loading || filters.page + 1 >= result.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Sau</button>
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
    if (deleting || !window.confirm(`Xóa công thức "${recipe.name}"? Công thức sẽ được đánh dấu là đã xóa.`)) return;
    setDeleting(true);
    setError("");
    try {
      await deleteAdminRecipe(recipeId);
      setNotice("Xóa công thức thành công.");
      navigate("/admin/recipes");
    } catch (requestError) {
      setError(requestError.message);
      setDeleting(false);
    }
  };
  return <>
    <Link to="/admin/recipes" className="text-emerald-700 underline">Quay lại danh sách công thức</Link>
    <AdminRequestState {...resource} onRetry={resource.retry} />
    <AdminRequestState error={error} />
    {recipe && <>
      <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">{recipe.name}</h1>
        {recipe.status === "ACTIVE" && <div className="flex gap-2">
          <Link className={BUTTON} to={`/admin/recipes/${recipeId}/edit`}>Chỉnh sửa công thức</Link>
          <button type="button" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={deleting} onClick={remove}>{deleting ? "Đang xóa…" : "Xóa công thức"}</button>
        </div>}
      </header>
      <article className={`${PANEL} space-y-4`}>
        <RecipeImage {...recipe} />
        <p className="text-sm text-slate-500">#{recipe.recipeId} · {recipe.categoryName || "Chưa phân loại"} · {recipe.status === "ACTIVE" ? "Đang hoạt động" : recipe.status === "DELETED" ? "Đã xóa" : recipe.status}</p>
        <p className="whitespace-pre-wrap">{recipe.description}</p>
        <p>Chuẩn bị: {recipe.prepTime ?? "—"} phút · Nấu: {recipe.cookTime ?? "—"} phút · Khẩu phần: {recipe.servings ?? "—"} · Độ khó: {DIFFICULTY_LABELS[recipe.difficulty] || recipe.difficulty || "—"}</p>
        <p>Calo: {recipe.calories ?? "—"} · Protein: {recipe.protein ?? "—"} · Tinh bột: {recipe.carbs ?? "—"} · Chất béo: {recipe.fat ?? "—"}</p>
        <h2 className="font-bold">Nguyên liệu</h2>
        <ul className="list-inside list-disc">{recipe.ingredients?.map((ingredient) => <li key={ingredient.ingredientId}>{ingredient.name}: {ingredient.quantity} {ingredient.unit}</li>)}</ul>
        <h2 className="font-bold">Cách thực hiện</h2><p className="whitespace-pre-wrap">{recipe.instructions}</p>
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
  if (resource.data.status !== "ACTIVE") return <p role="alert">Không thể chỉnh sửa công thức đã xóa. <Link to="/admin/recipes">Quay lại danh sách công thức</Link></p>;
  return <RecipeForm key={recipeId} recipe={resource.data} />;
}

function initialValues(recipe) {
  return {
    categoryId: String(recipe?.categoryId ?? ""), name: recipe?.name ?? "",
    description: recipe?.description ?? "", imageUrl: recipe?.imageUrl ?? "",
    prepTime: String(recipe?.prepTime ?? 0), cookTime: String(recipe?.cookTime ?? 0),
    instructions: recipe?.instructions ?? "",
    servings: String(recipe?.servings ?? 1), difficulty: recipe?.difficulty || "Easy",
    calories: String(recipe?.calories ?? ""), protein: String(recipe?.protein ?? ""),
    carbs: String(recipe?.carbs ?? ""), fat: String(recipe?.fat ?? ""),
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [uploading, setUploading] = useState(false);
  const saveInFlight = useRef(false);
  const uploadedImage = useRef(null);
  const imageInput = useRef(null);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);
  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError("");
    uploadedImage.current = null;
    setImageFile(null);
    setPreviewUrl("");
    if (!file.type.startsWith("image/") || file.size === 0 || file.size > MAX_IMAGE_SIZE) {
      setImageError("Vui lòng chọn file ảnh không rỗng, dung lượng tối đa 50 MB.");
      event.target.value = "";
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };
  const clearImageSelection = () => {
    setImageFile(null);
    setPreviewUrl("");
    setImageError("");
    uploadedImage.current = null;
    if (imageInput.current) imageInput.current.value = "";
  };
  const load = useCallback((signal) => getAdminRecipeIngredients({ signal }), []);
  const ingredients = useAdminResource(load);
  const change = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };
  const validateField = (field) => {
    setFieldErrors((current) => ({ ...current, [field]: validateAdditionalFields(values, original.difficulty)[field] || "" }));
  };
  const changeIngredient = (index, field, value) => setValues((current) => ({
    ...current, ingredients: current.ingredients.map((item, position) => position === index ? { ...item, [field]: value } : item),
  }));
  const cancel = () => {
    if (saveInFlight.current) return;
    if ((imageFile || JSON.stringify(values) !== JSON.stringify(original)) && !window.confirm("Discard your unsaved changes?")) return;
    navigate(recipe ? `/admin/recipes/${recipe.recipeId}` : "/admin/recipes");
  };
  const submit = async (event) => {
    event.preventDefault();
    if (saveInFlight.current || ingredients.loading || ingredients.error || imageError) return;
    setError("");
    const errors = validateAdditionalFields(values, original.difficulty);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    const ids = values.ingredients.map((item) => Number(item.ingredientId));
    if (new Set(ids).size !== ids.length) { setError("Choose each ingredient only once."); return; }
    if (!values.name.trim() || !values.instructions.trim() || values.ingredients.some((item) => !item.unit.trim() || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) {
      setError("Vui lòng nhập tên, cách thực hiện, định lượng nguyên liệu và đơn vị hợp lệ."); return;
    }
    const body = {
      name: values.name.trim(), categoryId: Number(values.categoryId),
      description: values.description, imageUrl: values.imageUrl, instructions: values.instructions,
      prepTime: Number(values.prepTime), cookTime: Number(values.cookTime),
      servings: Number(values.servings), difficulty: values.difficulty,
      ...Object.fromEntries(NUTRITION_FIELDS.map(([field]) => [field, values[field].trim() ? Number(values[field]) : null])),
      ingredients: values.ingredients.map((item) => ({ ingredientId: Number(item.ingredientId), quantity: Number(item.quantity), unit: item.unit.trim() })),
    };
    saveInFlight.current = true;
    setSaving(true);
    try {
      if (imageFile) {
        if (uploadedImage.current?.file !== imageFile) {
          setUploading(true);
          const media = await uploadMedia(imageFile);
          const url = new URL(media?.url);
          if (media?.mediaType !== "image" || url.protocol !== "https:" || url.hostname !== "res.cloudinary.com"
              || !url.pathname.includes("/image/upload/") || url.username || url.password || url.port || media.url.length > 255) {
            throw new Error("Dịch vụ upload chưa trả về URL ảnh Cloudinary hợp lệ.");
          }
          uploadedImage.current = { file: imageFile, url: media.url };
        }
        body.imageUrl = uploadedImage.current.url;
        setUploading(false);
      }
      const saved = recipe ? await updateAdminRecipe(recipe.recipeId, body) : await createAdminRecipe(body);
      setNotice(recipe ? "Cập nhật công thức thành công." : "Tạo công thức thành công.");
      navigate(`/admin/recipes/${saved.recipeId}`);
    } catch (requestError) {
      const fields = Object.values(requestError.data?.errors || {}).join("; ");
      setError(fields || requestError.message);
    } finally {
      saveInFlight.current = false;
      setSaving(false);
      setUploading(false);
    }
  };
  return <>
    <h1 className="text-2xl font-bold">{recipe ? "Chỉnh sửa công thức" : "Tạo công thức"}</h1>
    <AdminRequestState {...ingredients} onRetry={ingredients.retry} />
    <form onSubmit={submit} className={`${PANEL} space-y-5`}>
      <AdminRequestState error={error} />
      <fieldset disabled={saving} className="space-y-4">
        <label className="block text-sm font-medium">Tên công thức *<input className={FIELD} required maxLength={255} value={values.name} onChange={(event) => change("name", event.target.value)} /></label>
        <label className="block text-sm font-medium">Danh mục *<select className={FIELD} required value={values.categoryId} onChange={(event) => change("categoryId", event.target.value)}>
          <option value="">Chọn danh mục</option>
          {categories.filter((category) => category.status === "ACTIVE" || String(category.categoryId) === original.categoryId).map((category) => <option key={category.categoryId} value={category.categoryId}>{category.name}{category.status === "DELETED" ? " (đã xóa)" : ""}</option>)}
        </select></label>
        <label className="block text-sm font-medium">Mô tả<textarea className={FIELD} rows={3} value={values.description} onChange={(event) => change("description", event.target.value)} /></label>
        <label className="block text-sm font-medium">Ảnh công thức
          <input ref={imageInput} type="file" accept="image/*" className={FIELD} onChange={chooseImage}
            aria-invalid={Boolean(imageError)} aria-describedby="recipe-image-help recipe-image-error" />
        </label>
        <p id="recipe-image-help" className="text-sm text-slate-500">Chọn ảnh tối đa 50 MB. Ảnh sẽ được tải lên khi lưu công thức. Không chọn ảnh mới để giữ ảnh hiện tại.</p>
        <p id="recipe-image-error" role={imageError ? "alert" : undefined} className="text-sm text-red-600">{imageError}</p>
        {previewUrl ? <img src={previewUrl} alt="Ảnh xem trước công thức" className="h-40 w-56 rounded-lg object-cover" /> : <RecipeImage imageUrl={values.imageUrl} name={values.name} />}
        {(imageFile || imageError) && <button type="button" className="text-sm text-emerald-700 underline" onClick={clearImageSelection}>Bỏ ảnh đã chọn</button>}
        <div className="grid gap-4 sm:grid-cols-2">{[["prepTime", "Thời gian chuẩn bị (phút)"], ["cookTime", "Thời gian nấu (phút)"]].map(([field, label]) => <label key={field} className="text-sm font-medium">{label} *<input className={FIELD} type="number" min={0} max={2147483647} step={1} required value={values[field]} onChange={(event) => change(field, event.target.value)} /></label>)}</div>
        <>
          <fieldset className="min-w-0 space-y-3">
            <legend className="mb-3 font-bold">Thông tin công thức</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="recipe-servings" className="block text-sm font-medium">Số khẩu phần *</label>
                <input id="recipe-servings" name="servings" className={FIELD} type="number" min={1} max={2147483647} step={1} required
                  value={values.servings} onChange={(event) => change("servings", event.target.value)}
                  onBlur={() => validateField("servings")} onInvalid={() => validateField("servings")}
                  aria-invalid={Boolean(fieldErrors.servings)} aria-describedby={fieldErrors.servings ? "recipe-servings-error" : undefined} />
                {fieldErrors.servings && <p id="recipe-servings-error" role="alert" className="mt-1 text-sm text-red-600">{fieldErrors.servings}</p>}
              </div>
              <div>
                <label htmlFor="recipe-difficulty" className="block text-sm font-medium">Độ khó *</label>
                <select id="recipe-difficulty" name="difficulty" className={FIELD} required value={values.difficulty}
                  onChange={(event) => change("difficulty", event.target.value)} onBlur={() => validateField("difficulty")}
                  onInvalid={() => validateField("difficulty")} aria-invalid={Boolean(fieldErrors.difficulty)}
                  aria-describedby={fieldErrors.difficulty ? "recipe-difficulty-error" : undefined}>
                  {!DIFFICULTIES.includes(original.difficulty) && <option value={original.difficulty}>{original.difficulty}</option>}
                  {DIFFICULTIES.map((difficulty) => <option key={difficulty} value={difficulty}>{DIFFICULTY_LABELS[difficulty]}</option>)}
                </select>
                {fieldErrors.difficulty && <p id="recipe-difficulty-error" role="alert" className="mt-1 text-sm text-red-600">{fieldErrors.difficulty}</p>}
              </div>
            </div>
          </fieldset>
          <fieldset className="min-w-0 space-y-3">
            <legend className="mb-3 font-bold">Thông tin dinh dưỡng</legend>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {NUTRITION_FIELDS.map(([field, label, unit]) => <div key={field}>
                <label htmlFor={`recipe-${field}`} className="block text-sm font-medium">{label} ({unit})</label>
                <input id={`recipe-${field}`} name={field} className={FIELD} type="number" min={0} step="any"
                  value={values[field]} onChange={(event) => change(field, event.target.value)}
                  onBlur={() => validateField(field)} onInvalid={() => validateField(field)}
                  aria-invalid={Boolean(fieldErrors[field])} aria-describedby={fieldErrors[field] ? `recipe-${field}-error` : undefined} />
                {fieldErrors[field] && <p id={`recipe-${field}-error`} role="alert" className="mt-1 text-sm text-red-600">{fieldErrors[field]}</p>}
              </div>)}
            </div>
          </fieldset>
        </>
        <label className="block text-sm font-medium">Cách thực hiện *<textarea className={FIELD} rows={7} required value={values.instructions} onChange={(event) => change("instructions", event.target.value)} /></label>
        <h2 className="font-bold">Nguyên liệu *</h2>
        {values.ingredients.map((item, index) => <div key={index} className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <label className="text-sm">Nguyên liệu<select className={FIELD} required value={item.ingredientId} onChange={(event) => changeIngredient(index, "ingredientId", event.target.value)}>
            <option value="">Chọn nguyên liệu</option>{(ingredients.data || []).map((choice) => <option key={choice.ingredientId} value={choice.ingredientId}>{choice.name}</option>)}
          </select></label>
          <label className="text-sm">Số lượng<input className={FIELD} type="number" min="0.000001" step="any" required value={item.quantity} onChange={(event) => changeIngredient(index, "quantity", event.target.value)} /></label>
          <label className="text-sm">Đơn vị<input className={FIELD} required maxLength={50} value={item.unit} onChange={(event) => changeIngredient(index, "unit", event.target.value)} /></label>
          <button type="button" className="self-end rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50" disabled={values.ingredients.length === 1} onClick={() => change("ingredients", values.ingredients.filter((_, position) => index !== position))}>Xóa</button>
        </div>)}
        <button type="button" className={BUTTON} onClick={() => change("ingredients", [...values.ingredients, { ingredientId: "", quantity: "", unit: "" }])}>Thêm nguyên liệu</button>
      </fieldset>
      <div className="flex gap-3"><button className={BUTTON} type="submit" disabled={saving || Boolean(imageError) || ingredients.loading || Boolean(ingredients.error)}>{uploading ? "Đang tải ảnh…" : saving ? "Đang lưu…" : "Lưu công thức"}</button><button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm" disabled={saving} onClick={cancel}>Hủy</button></div>
    </form>
  </>;
}
