import { useCallback, useRef, useState } from "react";
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

import useAdminResource from "../../hooks/useAdminResource";
import AdminRequestState from "../../components/admin/AdminRequestState";
import MediaRenderer from "../../components/media/MediaRenderer";
import {
  getAdminArticles, getAdminArticle, getAdminCategories,
  createAdminArticle, updateAdminArticle, deleteAdminArticle,
  uploadAdminArticleImage,
} from "../../services/adminContentServices";

const PAGE_SIZE = 6;
const MAX_MEDIA_SIZE = 50 * 1024 * 1024;

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
  return Number(value || 0).toLocaleString("vi-VN");
}

function formatDate(value, options = {}) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  });
}

function getCategoryName(categoryId, categories) {
  return categories.find((category) => Number(category.categoryId) === Number(categoryId))?.name || "Chưa phân loại";
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

function Breadcrumbs({ current, parent = "Bài viết" }) {
  return (
    <nav aria-label="Đường dẫn điều hướng" className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-400">
      <Link to="/admin" className="transition-colors hover:text-emerald-700">
        Quản trị
      </Link>
      <ChevronRight aria-hidden="true" size={13} />
      <Link to="/admin/articles" className="transition-colors hover:text-emerald-700">
        Nội dung
      </Link>
      {parent !== "Bài viết" && (
        <>
          <ChevronRight aria-hidden="true" size={13} />
          <Link to="/admin/articles" className="transition-colors hover:text-emerald-700">
            Bài viết
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

function SessionNotice({ message, onDismiss }) {
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
        aria-label="Đóng thông báo"
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
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value == null ? "—" : formatCount(value)}</p>
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
      {isPublished ? "Đã xuất bản" : "Bản nháp"}
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
        <MediaRenderer
          src={article.coverImage}
          alt={article.title ? `Ảnh bìa: ${article.title}` : "Ảnh bìa bài viết"}
          controls={false}
          muted
          autoPlay
          loop
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}

function ArticleCard({ article, categories }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <Link
        to={`/admin/articles/${article.articleId}`}
        aria-label={`Xem bài viết ${article.title}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"
      >
        <ArticleCover article={article} className="aspect-[16/8]" />
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              <FileText aria-hidden="true" size={12} />
              Bài viết #{article.articleId}
            </span>
            <ArticleStatus status={article.status} />
          </div>
          <h2 className="line-clamp-2 min-h-[3.5rem] text-base font-bold leading-6 text-slate-900 transition-colors group-hover:text-emerald-800 sm:text-lg">
            {article.title}
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
              {getCategoryName(article.categoryId, categories)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" size={13} /> Cập nhật {formatDate(article.updatedAt)}
            </span>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
            Xem chi tiết
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
        {filtered ? "Không có bài viết phù hợp với bộ lọc" : "Chưa có bài viết"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {filtered
          ? "Hãy thử từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh sách bài viết."
          : "Tạo bài viết để xây dựng thư viện nội dung ChayBook."}
      </p>
      {filtered ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Xóa bộ lọc
        </button>
      ) : (
        <Link
          to="/admin/articles/new"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          <Plus aria-hidden="true" size={16} /> Tạo bài viết
        </Link>
      )}
    </div>
  );
}

export default function AdminArticleManagement() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [notice, setNotice] = useState("");
  const loadCategories = useCallback((signal) => getAdminCategories("ARTICLE", { signal }), []);
  const categoriesResource = useAdminResource(loadCategories);
  if (categoriesResource.loading || categoriesResource.error) {
    return <AdminRequestState {...categoriesResource} onRetry={categoriesResource.retry} />;
  }
  return (
    <Outlet context={{ categories: categoriesResource.data, filters, setFilters, notice, setNotice }} />
  );
}

export function AdminArticleListPage() {
  const { categories, filters, setFilters, notice, setNotice } = useOutletContext();
  const load = useCallback((signal) => getAdminArticles({
    q: filters.search.trim(), categoryId: filters.categoryId, status: filters.status,
    sort: filters.sort, page: filters.page, size: PAGE_SIZE, signal,
  }).then((data) => {
    if (!signal.aborted && filters.page > Math.max(0, data.totalPages - 1)) {
      setFilters((current) => ({ ...current, page: Math.max(0, data.totalPages - 1) }));
    }
    return data;
  }), [filters, setFilters]);
  const resource = useAdminResource(load);
  const loadCounts = useCallback(async (signal) => {
    const [all, published, draft] = await Promise.all([
      getAdminArticles({ size: 1, signal }),
      getAdminArticles({ status: "PUBLISHED", size: 1, signal }),
      getAdminArticles({ status: "DRAFT", size: 1, signal }),
    ]);
    return { total: all.totalElements, published: published.totalElements, draft: draft.totalElements };
  }, []);
  const counts = useAdminResource(loadCounts);
  const totalElements = resource.data?.totalElements ?? 0;
  const pageCount = resource.data?.totalPages ?? 0;
  const currentPage = filters.page;
  const pageArticles = resource.data?.items ?? [];
  const hasFilters = Boolean(filters.search || filters.categoryId !== "all" || filters.status !== "all");

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 0 }));
  };

  const clearFilters = () => setFilters({ ...INITIAL_FILTERS });

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <Breadcrumbs current="Bài viết" />
      <SessionNotice message={notice} onDismiss={() => setNotice("")} />
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Quản lý bài viết</h1>
        <Link
          to="/admin/articles/new"
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <Plus aria-hidden="true" size={17} /> Tạo bài viết
        </Link>
      </header>

      <section aria-label="Thống kê bài viết" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Tổng số bài viết" value={counts.data?.total} Icon={FileText} tone="emerald" />
        <StatCard label="Bài viết đã xuất bản" value={counts.data?.published} Icon={Activity} tone="blue" />
        <StatCard label="Bản nháp" value={counts.data?.draft} Icon={Pencil} tone="amber" />
      </section>
      <AdminRequestState {...counts} onRetry={counts.retry} />

      <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5" aria-label="Tìm kiếm và lọc bài viết">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_repeat(3,minmax(150px,190px))]">
          <label className="relative block">
            <span className="sr-only">Tìm bài viết theo tiêu đề</span>
            <Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Tìm bài viết theo tiêu đề..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
            />
          </label>
          <label className="relative block">
            <span className="sr-only">Lọc theo danh mục</span>
            <select
              value={filters.categoryId}
              onChange={(event) => updateFilter("categoryId", event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-3.5 pr-9 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </label>
          <label className="relative block">
            <span className="sr-only">Lọc theo trạng thái xuất bản</span>
            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-3.5 pr-9 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="PUBLISHED">Đã xuất bản</option>
              <option value="DRAFT">Bản nháp</option>
            </select>
            <ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </label>
          <label className="relative block">
            <span className="sr-only">Sắp xếp bài viết</span>
            <select
              value={filters.sort}
              onChange={(event) => updateFilter("sort", event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-3.5 pr-9 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
            </select>
            <ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </label>
        </div>
      </section>

      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className="text-sm text-slate-500">
          Hiển thị <span className="font-semibold text-slate-800">{pageArticles.length ? currentPage * PAGE_SIZE + 1 : 0}–{pageArticles.length ? currentPage * PAGE_SIZE + pageArticles.length : 0}</span> / {formatCount(totalElements)} bài viết
        </p>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="text-xs font-semibold text-emerald-800 hover:text-emerald-950">
            Xóa bộ lọc
          </button>
        )}
      </div>

      <AdminRequestState {...resource} onRetry={resource.retry} />
      {!resource.loading && !resource.error && (pageArticles.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {pageArticles.map((article) => <ArticleCard key={article.articleId} article={article} categories={categories} />)}
        </div>
      ) : (
        <EmptyArticles filtered={hasFilters || Boolean(filters.search)} onClear={clearFilters} />
      ))}

      {pageCount > 1 && (
        <nav aria-label="Phân trang bài viết" className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 sm:flex-row">
          <p className="text-xs text-slate-500">Trang {currentPage + 1} / {pageCount}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilters((current) => ({ ...current, page: Math.max(0, current.page - 1) }))}
              disabled={currentPage === 0 || resource.loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft aria-hidden="true" size={16} /> Trước
            </button>
            <button
              type="button"
              onClick={() => setFilters((current) => ({ ...current, page: Math.min(pageCount - 1, current.page + 1) }))}
              disabled={currentPage >= pageCount - 1 || resource.loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau <ChevronRight aria-hidden="true" size={16} />
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
  const { categories } = useOutletContext();
  return (
    <aside className="lg:sticky lg:top-6">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Thông tin bài viết</h2>
          <ArticleStatus status={article.status} />
        </div>
        <div className="mt-2">
          <ReadonlyField label="Danh mục" value={getCategoryName(article.categoryId, categories)} />
          <ReadonlyField label="Mã tác giả" value={article.createdBy == null ? "—" : `Người dùng ${article.createdBy}`} icon={UserRound} />
          <ReadonlyField label="Mã bài viết" value={`#${article.articleId}`} icon={FileText} />
          <ReadonlyField label="Ngày tạo" value={formatDate(article.createdAt)} icon={CalendarDays} />
          <ReadonlyField label="Cập nhật lần cuối" value={formatDate(article.updatedAt)} icon={Clock3} />
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
        <h2 id="discard-title" className="mt-4 text-lg font-bold text-slate-900">Hủy các thay đổi chưa lưu?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Các chỉnh sửa sẽ bị xóa khỏi biểu mẫu. Bạn không thể hoàn tác thao tác này.</p>
        <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <button type="button" onClick={onKeepEditing} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Tiếp tục chỉnh sửa</button>
          <button type="button" onClick={onDiscard} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">Hủy thay đổi</button>
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
  const { categories } = useOutletContext();
  const [initialValues] = useState(() => createFormValues(article));
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [imageError, setImageError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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

  const loadImage = async (file) => {
    if (isUploading || isSaving) return;
    setImageError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"].includes(file.type)) {
    setImageError("Vui lòng chọn tệp JPG, PNG, WebP, MP4, WebM hoặc MOV.");
      return;
    }
    if (file.size > MAX_MEDIA_SIZE) {
      setImageError("Vui lòng chọn tệp đa phương tiện nhỏ hơn 50 MB.");
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadAdminArticleImage(file);
      updateField("coverImage", response.coverImage);
    } catch (error) {
      setImageError(error.message || "Không thể tải ảnh lên.");
    } finally {
      setIsUploading(false);
    }
  };

  const requestCancel = () => {
    if (isDirty) setShowDiscard(true);
    else onCancel();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSaving || isUploading) return;
    const nextErrors = {};
    if (!values.title.trim()) nextErrors.title = "Vui lòng nhập tiêu đề bài viết.";
    if (values.title.trim().length > 255) nextErrors.title = "Tiêu đề không được vượt quá 255 ký tự.";
    if (!values.categoryId) nextErrors.categoryId = "Vui lòng chọn danh mục.";
    if (!values.content.trim()) nextErrors.content = "Vui lòng nhập nội dung bài viết.";
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length) return;

    setIsSaving(true);
    try {
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
      setErrors(error.data?.errors || {});
      setSubmitError(error?.message || "Không thể lưu bài viết. Vui lòng thử lại.");
    }
  };

  const isCreate = mode === "create";

  return (
    <>
      <div className="mx-auto w-full max-w-[1500px]">
        <Breadcrumbs current={isCreate ? "Tạo mới" : "Chỉnh sửa bài viết"} parent="Bài viết" />
        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {isCreate ? "Tạo nội dung mới" : "Cập nhật bài viết"}
          </h1>
        </header>

        <div className="mb-5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">
          <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">
            <FileText aria-hidden="true" size={14} /> Bài viết
          </span>
        </div>

        <form noValidate onSubmit={handleSubmit} className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(290px,0.85fr)]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Nội dung chính</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="mb-1.5">
                    <label htmlFor="article-title" className="text-sm font-semibold text-slate-800">Tiêu đề <span className="text-red-500">*</span></label>
                    <span className={`text-[11px] ${values.title.length > 240 ? "font-semibold text-amber-700" : "text-slate-400"}`}>{values.title.length}/255</span>
                  </div>
                  <input
                    id="article-title"
                    value={values.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    maxLength={255}
                    placeholder="Nhập tiêu đề bài viết"
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? titleErrorId : undefined}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${errors.title ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-600/10"}`}
                  />
                  {errors.title && <p id={titleErrorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600">{errors.title}</p>}
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor="article-summary-preview" className="text-sm font-semibold text-slate-800">Mô tả ngắn</label>
                  </div>
                  <textarea
                    id="article-summary-preview"
                    readOnly
                    value={summary}
                    placeholder="Phần đầu bài viết sẽ hiển thị tại đây để xem trước."
                    rows={3}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 outline-none placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">Ảnh bìa hoặc video</p>
                    <span className="text-[11px] text-slate-400">Không bắt buộc · JPG, PNG, WebP, MP4, WebM, MOV · tối đa 50 MB</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={isUploading || isSaving}
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
                      <span className="text-sm font-semibold text-slate-800">{isUploading ? "Đang tải lên…" : "Nhấn để tải lên hoặc kéo thả tệp vào đây"}</span>
                    </button>
                    <div className="relative min-h-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {values.coverImage ? (
                        <>
                          <MediaRenderer src={values.coverImage} alt="Xem trước ảnh bìa bài viết đã chọn" controls={false} muted autoPlay loop className="absolute inset-0 h-full w-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-slate-950/65 p-3 text-white">
                            <div className="flex gap-2">
                              <button type="button" disabled={isUploading || isSaving} onClick={() => fileInputRef.current?.click()} className="rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold transition hover:bg-white/25">Thay thế</button>
                              <button type="button" disabled={isUploading || isSaving} onClick={() => updateField("coverImage", "")} className="rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold transition hover:bg-red-500/80">Xóa</button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full min-h-40 flex-col items-center justify-center text-center text-slate-400">
                          <ImagePlus aria-hidden="true" size={25} strokeWidth={1.5} />
                          <span className="mt-2 text-xs font-medium">Chưa chọn ảnh</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    disabled={isUploading || isSaving}
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
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
                    <label htmlFor="article-content" className="text-sm font-semibold text-slate-800">Nội dung bài viết <span className="text-red-500">*</span></label>
                  </div>
                  <div className={`overflow-hidden rounded-xl border bg-white focus-within:ring-2 ${errors.content ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-500/10" : "border-slate-200 focus-within:border-emerald-600 focus-within:ring-emerald-600/10"}`}>
                    <textarea
                      id="article-content"
                      value={values.content}
                      onChange={(event) => updateField("content", event.target.value)}
                      rows={15}
                      placeholder="Nhập nội dung bài viết. Để một dòng trống giữa các đoạn."
                      aria-invalid={Boolean(errors.content)}
                      aria-describedby={errors.content ? contentErrorId : undefined}
                      className="min-h-[300px] w-full resize-y border-0 px-4 py-4 text-sm leading-7 text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0"
                    />
                  </div>
                  {errors.content && <p id={contentErrorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600">{errors.content}</p>}
                  <div className="mt-2 text-right text-[11px] text-slate-400">
                    {formatCount(wordCount)} từ <span className="mx-1">·</span> {getReadingTime(values.content)} phút đọc
                  </div>
                </div>
              </div>
            </section>

          </div>

          <aside className="space-y-4 xl:sticky xl:top-6">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Thông tin xuất bản</h2>
              </div>
              {!isCreate && (
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm"><UserRound aria-hidden="true" size={18} /></span>
                  <p className="truncate text-sm font-semibold text-slate-800">Người dùng {article?.createdBy ?? "—"}</p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label htmlFor="article-category" className="mb-1.5 block text-xs font-semibold text-slate-700">Danh mục <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      id="article-category"
                      value={values.categoryId}
                      onChange={(event) => updateField("categoryId", event.target.value)}
                      aria-invalid={Boolean(errors.categoryId)}
                      aria-describedby={errors.categoryId ? categoryErrorId : undefined}
                      className={`w-full appearance-none rounded-xl border bg-white px-3.5 py-3 pr-9 text-sm text-slate-800 outline-none transition focus:ring-2 ${errors.categoryId ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-600/10"}`}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.filter((category) => category.status === "ACTIVE" || String(category.categoryId) === initialValues.categoryId).map((category) => (
                        <option key={category.categoryId} value={category.categoryId}>{category.name}{category.status !== "ACTIVE" ? " (deleted)" : ""}</option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  {errors.categoryId && <p id={categoryErrorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600">{errors.categoryId}</p>}
                </div>
                <div>
                  <label htmlFor="article-status" className="mb-1.5 block text-xs font-semibold text-slate-700">Trạng thái xuất bản</label>
                  <div className="relative">
                    <select
                      id="article-status"
                      value={values.status}
                      onChange={(event) => updateField("status", event.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 pr-9 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                    >
                      <option value="DRAFT">Bản nháp</option>
                      <option value="PUBLISHED">Đã xuất bản</option>
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
                disabled={isSaving || isUploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
              >
                {isSaving ? <LoaderCircle aria-hidden="true" size={16} className="animate-spin" /> : <Check aria-hidden="true" size={16} />}
                {isSaving ? (isCreate ? "Đang tạo…" : "Đang cập nhật…") : isCreate ? "Tạo bài viết" : "Cập nhật bài viết"}
              </button>
              <button
                type="button"
                disabled={isSaving || isUploading}
                onClick={requestCancel}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
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
  const { setFilters, setNotice } = useOutletContext();

  const createArticle = async (values) => {
    const article = await createAdminArticle(values);
    setFilters((current) => ({ ...current, page: 0 }));
    setNotice("Đã thêm bài viết vào danh sách.");
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

function ArticleDetail({ article, onRefresh }) {
  const navigate = useNavigate();
  const { categories, notice, setNotice } = useOutletContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const publishInFlight = useRef(false);

  const publishArticle = async () => {
    if (article.status !== "DRAFT" || publishInFlight.current || isDeleting) return;
    publishInFlight.current = true;
    setIsPublishing(true);
    setPublishError("");
    try {
      await updateAdminArticle(article.articleId, {
        categoryId: article.categoryId,
        title: article.title,
        content: article.content,
        coverImage: article.coverImage,
        status: "PUBLISHED",
      });
      setNotice("Đã xuất bản bài viết thành công.");
      onRefresh();
    } catch (error) {
      setPublishError(error.message || "Không thể xuất bản bài viết. Vui lòng thử lại.");
    } finally {
      publishInFlight.current = false;
      setIsPublishing(false);
    }
  };

  const updateArticle = async (values) => {
    const updatedArticle = await updateAdminArticle(article.articleId, values);
    setNotice("Đã cập nhật bài viết.");
    return updatedArticle;
  };

  const removeArticle = async () => {
    if (isDeleting || publishInFlight.current || !window.confirm(`Permanently delete article "${article.title}"?`)) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteAdminArticle(article.articleId);
      setNotice("Article deleted.");
      navigate("/admin/articles");
    } catch (error) {
      setDeleteError(error.message);
      setIsDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <ArticleForm
        key={`edit-${article.articleId}`}
        mode="edit"
        article={article}
        onSubmit={updateArticle}
        onComplete={() => { setIsEditing(false); onRefresh(); }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <Breadcrumbs current="Chi tiết bài viết" parent="Bài viết" />
      <SessionNotice message={notice} onDismiss={() => setNotice("")} />
      <AdminRequestState error={deleteError} />
      <AdminRequestState error={publishError} />
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Chi tiết bài viết</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/articles" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            <ArrowLeft aria-hidden="true" size={16} /> Quay lại danh sách bài viết
          </Link>
          {article.status === "DRAFT" && (
            <button type="button" disabled={isPublishing || isDeleting} onClick={publishArticle}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {isPublishing ? <LoaderCircle aria-hidden="true" size={15} className="animate-spin" /> : <Check aria-hidden="true" size={15} />}
              {isPublishing ? "Đang xuất bản…" : "Publish"}
            </button>
          )}
          <button type="button" disabled={isDeleting || isPublishing} onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800">
            <Pencil aria-hidden="true" size={15} /> Chỉnh sửa bài viết
          </button>
          <button type="button" disabled={isDeleting || isPublishing} onClick={removeArticle} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {isDeleting ? "Đang xóa…" : "Xóa bài viết"}
          </button>
        </div>
      </header>

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(290px,0.85fr)]">
        <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <ArticleCover article={article} className="aspect-[16/6] sm:aspect-[16/5]" />
          <div className="p-5 sm:p-7">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">{getCategoryName(article.categoryId, categories)}</span>
              <ArticleStatus status={article.status} />
            </div>
            <h2 className="break-words text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">{article.title}</h2>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 pb-5 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2 font-medium text-slate-700"><UserRound aria-hidden="true" size={15} /> Người dùng {article.createdBy ?? "—"}</span>
              <span className="inline-flex items-center gap-2"><CalendarDays aria-hidden="true" size={15} /> {formatDate(article.createdAt)}</span>
              <span className="inline-flex items-center gap-2"><Clock3 aria-hidden="true" size={15} /> {getReadingTime(article.content)} phút đọc</span>
            </div>
            <div className="mt-6 whitespace-pre-wrap break-words text-[15px] leading-8 text-slate-700">
              {article.content || "Chưa có nội dung bài viết."}
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
  const load = useCallback((signal) => getAdminArticle(articleId, { signal }), [articleId]);
  const resource = useAdminResource(load);
  const article = resource.data;
  if (resource.loading || resource.error) return <AdminRequestState {...resource} onRetry={resource.retry} />;

  if (!article) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><BookOpen aria-hidden="true" size={25} /></span>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Không tìm thấy bài viết</h1>
        <Link to="/admin/articles" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"><ArrowLeft aria-hidden="true" size={15} /> Quay lại danh sách bài viết</Link>
      </div>
    );
  }

  return <ArticleDetail key={article.articleId} article={article} onRefresh={resource.retry} />;
}
