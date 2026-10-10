import { useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  ImagePlus,
  Info,
  Leaf,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import {
  Link,
  Outlet,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";

import { MOCK_ARTICLES, MOCK_ARTICLE_CATEGORIES } from "./adminArticleMockData";

const PAGE_SIZE = 6;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const INITIAL_FILTERS = {
  search: "",
  categoryId: "all",
  status: "all",
  sort: "newest",
  page: 0,
};

const COVER_THEMES = [
  "from-emerald-100 via-lime-50 to-amber-50 text-emerald-800",
  "from-amber-100 via-orange-50 to-emerald-50 text-orange-800",
  "from-lime-100 via-emerald-50 to-teal-50 text-teal-800",
  "from-stone-100 via-lime-50 to-yellow-50 text-lime-800",
];

function formatCount(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatDate(value, options = {}) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  });
}

function getCategory(categoryId) {
  return MOCK_ARTICLE_CATEGORIES.find(
    (category) => Number(category.categoryId) === Number(categoryId),
  );
}

function getCategoryName(categoryId) {
  return getCategory(categoryId)?.name || "Uncategorized";
}

function getExcerpt(content = "", maxLength = 170) {
  const text = String(content).replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

function getReadingTime(content = "") {
  const words = String(content).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function Breadcrumbs({ current, parent = "Articles" }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-400">
      <Link to="/admin" className="transition-colors hover:text-emerald-700">
        Admin
      </Link>
      <ChevronRight aria-hidden="true" size={13} />
      <Link to="/admin/articles" className="transition-colors hover:text-emerald-700">
        Content
      </Link>
      {parent !== "Articles" && (
        <>
          <ChevronRight aria-hidden="true" size={13} />
          <Link to="/admin/articles" className="transition-colors hover:text-emerald-700">
            Articles
          </Link>
        </>
      )}
      <ChevronRight aria-hidden="true" size={13} />
      <span aria-current="page" className="text-emerald-800">
        {current}
      </span>
    </nav>
  );
}

function MockSessionNotice({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
    >
      <Info aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
      <p className="min-w-0 flex-1">{message}</p>
      <button
        type="button"
        aria-label="Dismiss message"
        onClick={onDismiss}
        className="rounded-md p-1 text-emerald-700 transition hover:bg-emerald-100"
      >
        <X aria-hidden="true" size={16} />
      </button>
    </div>
  );
}

function StatCard({ label, value, Icon, tone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-sky-50 text-sky-700 ring-sky-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
          <Icon aria-hidden="true" size={18} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{formatCount(value)}</p>
    </section>
  );
}

function ArticleStatus({ status }) {
  const isPublished = status === "PUBLISHED";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        isPublished ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isPublished ? "bg-emerald-600" : "bg-amber-500"}`} />
      {isPublished ? "Published" : "Draft"}
    </span>
  );
}

function ArticleCover({ article, className = "" }) {
  const theme = COVER_THEMES[Math.abs(Number(article.categoryId || 0)) % COVER_THEMES.length];
  return (
    <div className={`relative isolate flex items-center justify-center overflow-hidden bg-gradient-to-br ${theme} ${className}`}>
      <span aria-hidden="true" className="absolute -right-6 -top-10 h-32 w-32 rounded-full border border-current/10" />
      <span aria-hidden="true" className="absolute -bottom-16 -left-5 h-36 w-36 rounded-full border border-current/10" />
      <span aria-hidden="true" className="absolute left-[22%] top-[18%] h-2 w-2 rounded-full bg-current/20" />
      <span aria-hidden="true" className="absolute bottom-[22%] right-[25%] h-1.5 w-1.5 rounded-full bg-current/25" />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/70 bg-white/65 shadow-sm backdrop-blur-sm">
        <Leaf aria-hidden="true" size={27} strokeWidth={1.6} />
      </div>
      {article.coverImage && (
        <img
          src={article.coverImage}
          alt={article.title ? `Cover for ${article.title}` : "Article cover"}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}

function ArticleCard({ article }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <Link
        to={`/admin/articles/${article.articleId}`}
        aria-label={`View article ${article.title}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"
      >
        <ArticleCover article={article} className="aspect-[16/8]" />
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              <FileText aria-hidden="true" size={12} />
              Article #{article.articleId}
            </span>
            <ArticleStatus status={article.status} />
          </div>
          <h2 className="line-clamp-2 min-h-[3.5rem] text-base font-bold leading-6 text-slate-900 transition-colors group-hover:text-emerald-800 sm:text-lg">
            {article.title}
          </h2>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
            {getExcerpt(article.content, 140) || "No content preview available."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
              {getCategoryName(article.categoryId)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserRound aria-hidden="true" size={13} /> User {article.createdBy ?? "—"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" size={13} /> {formatDate(article.createdAt)}
            </span>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
            View details
            <ArrowRight aria-hidden="true" size={15} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>
    </article>
  );
}

function EmptyArticles({ filtered, onClear }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <BookOpen aria-hidden="true" size={25} />
      </span>
      <h2 className="mt-4 text-lg font-bold text-slate-900">
        {filtered ? "No articles match these filters" : "No articles yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {filtered
          ? "Try a different search or clear the filters to see the full article list."
          : "Create an article to start building the ChayBook content library."}
      </p>
      {filtered ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Clear filters
        </button>
      ) : (
        <Link
          to="/admin/articles/new"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          <Plus aria-hidden="true" size={16} /> Create article
        </Link>
      )}
    </div>
  );
}

export default function AdminArticleManagement() {
  const [articles, setArticles] = useState(() => MOCK_ARTICLES.map((article) => ({ ...article })));
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [notice, setNotice] = useState("");

  const context = useMemo(
    () => ({
      articles,
      setArticles,
      filters,
      setFilters,
      notice,
      setNotice,
    }),
    [articles, filters, notice],
  );

  return <Outlet context={context} />;
}

export function AdminArticleListPage() {
  const { articles, filters, setFilters, notice, setNotice } = useOutletContext();
  const publishedCount = articles.filter((article) => article.status === "PUBLISHED").length;
  const draftCount = articles.filter((article) => article.status === "DRAFT").length;

  const filteredArticles = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return articles
      .filter((article) => {
        const categoryName = getCategoryName(article.categoryId).toLowerCase();
        const author = `user ${article.createdBy ?? ""}`.toLowerCase();
        const matchesSearch =
          !query ||
          [article.title, categoryName, author].some((value) => String(value || "").toLowerCase().includes(query));
        const matchesCategory =
          filters.categoryId === "all" || Number(article.categoryId) === Number(filters.categoryId);
        const matchesStatus = filters.status === "all" || article.status === filters.status;
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((left, right) => {
        const direction = filters.sort === "oldest" ? 1 : -1;
        return direction * (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
      });
  }, [articles, filters]);

  const pageCount = Math.ceil(filteredArticles.length / PAGE_SIZE);
  const currentPage = Math.min(filters.page, Math.max(0, pageCount - 1));
  const pageArticles = filteredArticles.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const hasFilters = Boolean(filters.search || filters.categoryId !== "all" || filters.status !== "all");

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: key === "sort" ? current.page : 0 }));
  };

  const clearFilters = () => setFilters({ ...INITIAL_FILTERS });

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <Breadcrumbs current="Articles" />
      <MockSessionNotice message={notice} onDismiss={() => setNotice("")} />
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Article Management</h1>
        <Link
          to="/admin/articles/new"
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <Plus aria-hidden="true" size={17} /> Create Article
        </Link>
      </header>

      <section aria-label="Article statistics" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Articles" value={articles.length} Icon={FileText} tone="emerald" />
        <StatCard label="Published Articles" value={publishedCount} Icon={Activity} tone="blue" />
        <StatCard label="Draft Articles" value={draftCount} Icon={Pencil} tone="amber" />
      </section>

      <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5" aria-label="Search and filter articles">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_repeat(3,minmax(150px,190px))]">
          <label className="relative block">
            <span className="sr-only">Search articles by title, author, or category</span>
            <Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search articles by title, author, or category..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
            />
          </label>
          <label className="relative block">
            <span className="sr-only">Filter by category</span>
            <select
              value={filters.categoryId}
              onChange={(event) => updateFilter("categoryId", event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-3.5 pr-9 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
            >
              <option value="all">All categories</option>
              {MOCK_ARTICLE_CATEGORIES.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </label>
          <label className="relative block">
            <span className="sr-only">Filter by publication status</span>
            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-3.5 pr-9 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
            >
              <option value="all">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
            <ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </label>
          <label className="relative block">
            <span className="sr-only">Sort articles</span>
            <select
              value={filters.sort}
              onChange={(event) => updateFilter("sort", event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-3.5 pr-9 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </label>
        </div>
      </section>

      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-800">{filteredArticles.length ? currentPage * PAGE_SIZE + 1 : 0}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredArticles.length)}</span> of {formatCount(filteredArticles.length)} articles
        </p>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="text-xs font-semibold text-emerald-800 hover:text-emerald-950">
            Clear filters
          </button>
        )}
      </div>

      {pageArticles.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {pageArticles.map((article) => <ArticleCard key={article.articleId} article={article} />)}
        </div>
      ) : (
        <EmptyArticles filtered={hasFilters || Boolean(filters.search)} onClear={clearFilters} />
      )}

      {pageCount > 1 && (
        <nav aria-label="Article pagination" className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 sm:flex-row">
          <p className="text-xs text-slate-500">Page {currentPage + 1} of {pageCount}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilters((current) => ({ ...current, page: Math.max(0, current.page - 1) }))}
              disabled={currentPage === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft aria-hidden="true" size={16} /> Previous
            </button>
            <button
              type="button"
              onClick={() => setFilters((current) => ({ ...current, page: Math.min(pageCount - 1, current.page + 1) }))}
              disabled={currentPage >= pageCount - 1}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight aria-hidden="true" size={16} />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

function ReadonlyField({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-3 last:border-0 last:pb-0">
      <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
        {Icon && <Icon aria-hidden="true" size={14} />}{label}
      </span>
      <span className="max-w-[60%] break-words text-right text-sm font-semibold text-slate-800">{value || "—"}</span>
    </div>
  );
}

function DetailSidebar({ article }) {
  return (
    <aside className="lg:sticky lg:top-6">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Article information</h2>
          <ArticleStatus status={article.status} />
        </div>
        <div className="mt-2">
          <ReadonlyField label="Category" value={getCategoryName(article.categoryId)} />
          <ReadonlyField label="Author ID" value={article.createdBy == null ? "—" : `User ${article.createdBy}`} icon={UserRound} />
          <ReadonlyField label="Article ID" value={`#${article.articleId}`} icon={FileText} />
          <ReadonlyField label="Created" value={formatDate(article.createdAt)} icon={CalendarDays} />
          <ReadonlyField label="Last updated" value={formatDate(article.updatedAt)} icon={Clock3} />
        </div>
      </section>
    </aside>
  );
}

function ConfirmDiscardDialog({ onKeepEditing, onDiscard }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <section role="dialog" aria-modal="true" aria-labelledby="discard-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <Info aria-hidden="true" size={21} />
        </div>
        <h2 id="discard-title" className="mt-4 text-lg font-bold text-slate-900">Discard unsaved changes?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Your edits will be removed from this form. This action cannot be undone.</p>
        <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <button type="button" onClick={onKeepEditing} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Keep editing</button>
          <button type="button" onClick={onDiscard} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">Discard changes</button>
        </div>
      </section>
    </div>
  );
}

function createFormValues(article) {
  return {
    title: article?.title || "",
    categoryId: article?.categoryId ? String(article.categoryId) : "",
    content: article?.content || "",
    coverImage: article?.coverImage || "",
    status: article?.status || "DRAFT",
  };
}

function ArticleForm({ mode, article, onCancel, onSubmit, onComplete }) {
  const [initialValues] = useState(() => createFormValues(article));
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [imageError, setImageError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const fileInputRef = useRef(null);

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  const summary = getExcerpt(values.content, 200);
  const wordCount = values.content.trim().split(/\s+/).filter(Boolean).length;
  const titleErrorId = "article-title-error";
  const categoryErrorId = "article-category-error";
  const contentErrorId = "article-content-error";

  const updateField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitError("");
  };

  const loadImage = (file) => {
    setImageError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("Choose an image smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") updateField("coverImage", reader.result);
    };
    reader.onerror = () => setImageError("This image could not be previewed. Try another file.");
    reader.readAsDataURL(file);
  };

  const requestCancel = () => {
    if (isDirty) setShowDiscard(true);
    else onCancel();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!values.title.trim()) nextErrors.title = "Enter an article title.";
    if (!values.categoryId) nextErrors.categoryId = "Choose a category.";
    if (!values.content.trim()) nextErrors.content = "Write the article content.";
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length) return;

    setIsSaving(true);
    try {
      // Small local delay gives the demo form a visible submitting state. No request is made.
      await new Promise((resolve) => window.setTimeout(resolve, 280));
      const savedArticle = await onSubmit({
        ...values,
        categoryId: Number(values.categoryId),
        title: values.title.trim(),
        content: values.content.trim(),
      });
      setIsSaving(false);
      onComplete(savedArticle);
    } catch (error) {
      setIsSaving(false);
      setSubmitError(error?.message || "Unable to save the article. Please try again.");
    }
  };

  const isCreate = mode === "create";

  return (
    <>
      <div className="mx-auto w-full max-w-[1500px]">
        <Breadcrumbs current={isCreate ? "Create New" : "Edit Article"} parent="Articles" />
        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {isCreate ? "Create New Content" : "Update Article"}
          </h1>
        </header>

        <div className="mb-5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">
          <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">
            <FileText aria-hidden="true" size={14} /> Article
          </span>
        </div>

        <form noValidate onSubmit={handleSubmit} className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(290px,0.85fr)]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Main Content</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="mb-1.5">
                    <label htmlFor="article-title" className="text-sm font-semibold text-slate-800">Title <span className="text-red-500">*</span></label>
                    <span className={`text-[11px] ${values.title.length > 240 ? "font-semibold text-amber-700" : "text-slate-400"}`}>{values.title.length}/255</span>
                  </div>
                  <input
                    id="article-title"
                    value={values.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    maxLength={255}
                    placeholder="Enter an article title"
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? titleErrorId : undefined}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${errors.title ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-600/10"}`}
                  />
                  {errors.title && <p id={titleErrorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600">{errors.title}</p>}
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor="article-summary-preview" className="text-sm font-semibold text-slate-800">Short Description</label>
                  </div>
                  <textarea
                    id="article-summary-preview"
                    readOnly
                    value={summary}
                    placeholder="The first part of your article will appear here as a preview."
                    rows={3}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 outline-none placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">Cover Image</p>
                    <span className="text-[11px] text-slate-400">Optional · JPG, PNG, WebP · up to 5 MB</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        loadImage(event.dataTransfer.files?.[0]);
                      }}
                      className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                    >
                      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                        <UploadCloud aria-hidden="true" size={20} />
                      </span>
                      <span className="text-sm font-semibold text-slate-800">Click to upload or drag and drop</span>
                    </button>
                    <div className="relative min-h-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {values.coverImage ? (
                        <>
                          <img src={values.coverImage} alt="Selected article cover preview" className="absolute inset-0 h-full w-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-slate-950/65 p-3 text-white">
                            <div className="flex gap-2">
                              <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold transition hover:bg-white/25">Replace</button>
                              <button type="button" onClick={() => updateField("coverImage", "")} className="rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold transition hover:bg-red-500/80">Remove</button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full min-h-40 flex-col items-center justify-center text-center text-slate-400">
                          <ImagePlus aria-hidden="true" size={25} strokeWidth={1.5} />
                          <span className="mt-2 text-xs font-medium">No image selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      loadImage(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  {imageError && <p role="alert" className="mt-2 text-xs font-medium text-red-600">{imageError}</p>}
                </div>

                <div>
                  <div className="mb-2">
                    <label htmlFor="article-content" className="text-sm font-semibold text-slate-800">Content Body <span className="text-red-500">*</span></label>
                  </div>
                  <div className={`overflow-hidden rounded-xl border bg-white focus-within:ring-2 ${errors.content ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-500/10" : "border-slate-200 focus-within:border-emerald-600 focus-within:ring-emerald-600/10"}`}>
                    <textarea
                      id="article-content"
                      value={values.content}
                      onChange={(event) => updateField("content", event.target.value)}
                      rows={15}
                      placeholder="Write your article here. Leave a blank line between paragraphs."
                      aria-invalid={Boolean(errors.content)}
                      aria-describedby={errors.content ? contentErrorId : undefined}
                      className="min-h-[300px] w-full resize-y border-0 px-4 py-4 text-sm leading-7 text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0"
                    />
                  </div>
                  {errors.content && <p id={contentErrorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600">{errors.content}</p>}
                  <div className="mt-2 text-right text-[11px] text-slate-400">
                    {formatCount(wordCount)} words <span className="mx-1">·</span> {getReadingTime(values.content)} min read
                  </div>
                </div>
              </div>
            </section>

          </div>

          <aside className="space-y-4 xl:sticky xl:top-6">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Publishing Details</h2>
              </div>
              {!isCreate && (
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm"><UserRound aria-hidden="true" size={18} /></span>
                  <p className="truncate text-sm font-semibold text-slate-800">User {article?.createdBy ?? "—"}</p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label htmlFor="article-category" className="mb-1.5 block text-xs font-semibold text-slate-700">Category <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      id="article-category"
                      value={values.categoryId}
                      onChange={(event) => updateField("categoryId", event.target.value)}
                      aria-invalid={Boolean(errors.categoryId)}
                      aria-describedby={errors.categoryId ? categoryErrorId : undefined}
                      className={`w-full appearance-none rounded-xl border bg-white px-3.5 py-3 pr-9 text-sm text-slate-800 outline-none transition focus:ring-2 ${errors.categoryId ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-600/10"}`}
                    >
                      <option value="">Choose category</option>
                      {MOCK_ARTICLE_CATEGORIES.map((category) => (
                        <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  {errors.categoryId && <p id={categoryErrorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600">{errors.categoryId}</p>}
                </div>
                <div>
                  <label htmlFor="article-status" className="mb-1.5 block text-xs font-semibold text-slate-700">Publication Status</label>
                  <div className="relative">
                    <select
                      id="article-status"
                      value={values.status}
                      onChange={(event) => updateField("status", event.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 pr-9 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                    <ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              {submitError && <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{submitError}</p>}
              <button
                type="submit"
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
              >
                {isSaving ? <LoaderCircle aria-hidden="true" size={16} className="animate-spin" /> : <Check aria-hidden="true" size={16} />}
                {isSaving ? (isCreate ? "Creating…" : "Updating…") : isCreate ? "Create Article" : "Update Article"}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={requestCancel}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            </section>
          </aside>
        </form>
      </div>
      {showDiscard && (
        <ConfirmDiscardDialog onKeepEditing={() => setShowDiscard(false)} onDiscard={onCancel} />
      )}
    </>
  );
}

export function AdminArticleCreatePage() {
  const navigate = useNavigate();
  const { articles, setArticles, setFilters, setNotice } = useOutletContext();

  const createArticle = (values) => {
    const now = new Date().toISOString();
    const articleId = Math.max(100, ...articles.map((item) => Number(item.articleId) || 0)) + 1;
    const article = {
      articleId,
      categoryId: values.categoryId,
      createdBy: 1,
      title: values.title,
      content: values.content,
      coverImage: values.coverImage,
      status: values.status,
      createdAt: now,
      updatedAt: now,
    };
    setArticles((current) => [article, ...current]);
    setFilters((current) => ({ ...current, page: 0 }));
    setNotice("Article added to the list.");
    return article;
  };

  return (
    <ArticleForm
      mode="create"
      article={null}
      onSubmit={createArticle}
      onComplete={() => navigate("/admin/articles")}
      onCancel={() => navigate("/admin/articles")}
    />
  );
}

function ArticleDetail({ article }) {
  const { setArticles, notice, setNotice } = useOutletContext();
  const [isEditing, setIsEditing] = useState(false);

  const updateArticle = (values) => {
    const updatedArticle = {
      ...article,
      categoryId: values.categoryId,
      title: values.title,
      content: values.content,
      coverImage: values.coverImage,
      status: values.status,
      updatedAt: new Date().toISOString(),
    };
    setArticles((current) => current.map((item) => item.articleId === article.articleId ? updatedArticle : item));
    setNotice("Article updated.");
    return updatedArticle;
  };

  if (isEditing) {
    return (
      <ArticleForm
        key={`edit-${article.articleId}`}
        mode="edit"
        article={article}
        onSubmit={updateArticle}
        onComplete={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <Breadcrumbs current="Article Detail" parent="Articles" />
      <MockSessionNotice message={notice} onDismiss={() => setNotice("")} />
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Article Detail</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/articles" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            <ArrowLeft aria-hidden="true" size={16} /> Back to Articles
          </Link>
          <button type="button" onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800">
            <Pencil aria-hidden="true" size={15} /> Edit Article
          </button>
        </div>
      </header>

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(290px,0.85fr)]">
        <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <ArticleCover article={article} className="aspect-[16/6] sm:aspect-[16/5]" />
          <div className="p-5 sm:p-7">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">{getCategoryName(article.categoryId)}</span>
              <ArticleStatus status={article.status} />
            </div>
            <h2 className="break-words text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">{article.title}</h2>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 pb-5 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2 font-medium text-slate-700"><UserRound aria-hidden="true" size={15} /> User {article.createdBy ?? "—"}</span>
              <span className="inline-flex items-center gap-2"><CalendarDays aria-hidden="true" size={15} /> {formatDate(article.createdAt)}</span>
              <span className="inline-flex items-center gap-2"><Clock3 aria-hidden="true" size={15} /> {getReadingTime(article.content)} min read</span>
            </div>
            <div className="mt-6 whitespace-pre-wrap break-words text-[15px] leading-8 text-slate-700">
              {article.content || "No article content has been added."}
            </div>
          </div>
        </article>
        <DetailSidebar article={article} />
      </div>
    </div>
  );
}

export function AdminArticleDetailPage() {
  const { articleId } = useParams();
  const { articles } = useOutletContext();
  const article = articles.find((item) => String(item.articleId) === articleId);

  if (!article) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><BookOpen aria-hidden="true" size={25} /></span>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Article not found</h1>
        <Link to="/admin/articles" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"><ArrowLeft aria-hidden="true" size={15} /> Back to Articles</Link>
      </div>
    );
  }

  return <ArticleDetail key={article.articleId} article={article} />;
}
