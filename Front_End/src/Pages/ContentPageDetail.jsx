import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  CalendarDays,
  Clock3,
  FileText,
  FolderOpen,
  Heart,
  Share2,
  UserRound,
} from "lucide-react";

import { getArticleDetail, getArticles } from "../services/articleServices";
import { getCategories } from "../services/categoryServices";

function formatArticleDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatArticleStatus(status) {
  if (typeof status !== "string" || !status.trim()) {
    return "—";
  }

  switch (status.toUpperCase()) {
    case "PUBLISHED":
      return "Đã xuất bản";
    case "DRAFT":
      return "Bản nháp";
    default:
      return status;
  }
}

function BackToContent() {
  return (
    <div className="mb-6 flex justify-start">
      <Link
        to="/content"
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#e7f5e9] px-4 py-2 text-sm font-semibold text-chaybook-primary transition-colors hover:bg-[#d9efdd]"
      >
        <ArrowLeft aria-hidden="true" size={17} />
        Back to Content
      </Link>
    </div>
  );
}

function ArticleActions({ liked, saved, onLike, onSave, onShare }) {
  const actionClass =
    "inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm font-semibold text-[#181c1b] shadow-sm transition-colors hover:bg-[#f7faf7]";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        aria-pressed={liked}
        onClick={onLike}
        className={actionClass}
      >
        <Heart
          aria-hidden="true"
          size={19}
          className={liked ? "fill-red-500 text-red-500" : "text-red-500"}
        />
        {liked ? "Liked" : "Like"}
      </button>
      <button
        type="button"
        aria-pressed={saved}
        onClick={onSave}
        className={actionClass}
      >
        <Bookmark
          aria-hidden="true"
          size={19}
          className={saved ? "fill-chaybook-primary text-chaybook-primary" : ""}
        />
        {saved ? "Đã lưu bài viết" : "Lưu bài viết"}
      </button>
      <button type="button" onClick={onShare} className={actionClass}>
        <Share2 aria-hidden="true" size={19} />
        Chia sẻ
      </button>
    </div>
  );
}

function ArticleInfoRow({ Icon, label, value, isPublished = false }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
      <dt className="flex min-w-0 items-center gap-2.5 text-[#6e7b6c]">
        <Icon aria-hidden="true" size={17} className="shrink-0" />
        <span>{label}</span>
      </dt>
      <dd
        className={`max-w-44 text-right font-semibold ${
          isPublished ? "text-emerald-700" : "text-[#28312b]"
        }`}
      >
        {isPublished && (
          <span
            aria-hidden="true"
            className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-600"
          />
        )}
        {value}
      </dd>
    </div>
  );
}

function ArticleInformation({ article, categoryName, categoryError }) {
  const isPublished = article.status?.toUpperCase() === "PUBLISHED";
  const author =
    article.createdBy != null ? `User ${article.createdBy}` : "—";

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <FileText aria-hidden="true" size={20} className="text-chaybook-primary" />
        <h2 className="text-lg font-bold text-[#181c1b]">Thông tin bài viết</h2>
      </div>
      <dl className="space-y-4">
        <ArticleInfoRow
          Icon={FolderOpen}
          label="Danh mục"
          value={categoryError ? "Không tải được" : categoryName || "—"}
        />
        <ArticleInfoRow Icon={UserRound} label="Tác giả" value={author} />
        <ArticleInfoRow
          Icon={CalendarDays}
          label="Ngày đăng"
          value={formatArticleDate(article.createdAt)}
        />
        <ArticleInfoRow
          Icon={BadgeCheck}
          label="Trạng thái"
          value={formatArticleStatus(article.status)}
          isPublished={isPublished}
        />
        <ArticleInfoRow
          Icon={Clock3}
          label="Cập nhật gần nhất"
          value={formatArticleDate(article.updatedAt)}
        />
      </dl>
    </section>
  );
}

function RelatedArticles({ articles, loading, error }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <FileText aria-hidden="true" size={20} className="text-chaybook-primary" />
        <h2 className="text-lg font-bold text-[#181c1b]">Bài viết liên quan</h2>
      </div>

      {loading ? (
        <p className="text-sm text-[#6e7b6c]">Đang tải bài viết...</p>
      ) : error ? (
        <p role="status" className="text-sm text-[#6e7b6c]">
          Không tải được bài viết liên quan.
        </p>
      ) : articles.length > 0 ? (
        <div className="space-y-3">
          {articles.map((relatedArticle) => (
            <Link
              key={relatedArticle.articleId}
              to={`/content/${relatedArticle.articleId}`}
              className="group flex min-w-0 items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-[#f7faf7]"
            >
              {relatedArticle.coverImage ? (
                <img
                  src={relatedArticle.coverImage}
                  alt={relatedArticle.title || ""}
                  loading="lazy"
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#edf4ee] text-chaybook-primary"
                >
                  <FileText size={21} />
                </span>
              )}
              <span className="min-w-0">
                <span className="line-clamp-2 text-sm font-semibold leading-5 text-[#181c1b] transition-colors group-hover:text-chaybook-primary">
                  {relatedArticle.title}
                </span>
                <span className="mt-1 block text-xs text-[#6e7b6c]">
                  {formatArticleDate(relatedArticle.createdAt)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#6e7b6c]">
          Chưa có bài viết liên quan.
        </p>
      )}
    </section>
  );
}

function ArticleDetailView({
  article,
  categoryName,
  categoryError,
  relatedArticles,
  relatedLoading,
  relatedError,
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [actionFeedback, setActionFeedback] = useState("");

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setActionFeedback("Đã sao chép liên kết bài viết.");
    } catch (error) {
      console.error("Failed to copy the article link:", error);
      setActionFeedback("Không thể sao chép liên kết trong trình duyệt này.");
    }
  };

  return (
    <div className="bg-[#f3f8f4] px-4 py-6 text-[#181c1b] sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <BackToContent />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          <article className="min-w-0 rounded-2xl bg-white p-5 shadow-sm sm:p-7 lg:col-span-8 lg:p-8">
            <header className="mb-5 space-y-3">
              {categoryName && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3f5e7] px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-700" />
                  {categoryName}
                </span>
              )}
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#181c1b] sm:text-3xl lg:text-4xl">
                {article.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#6e7b6c]">
                <span className="inline-flex items-center gap-2 font-semibold text-[#28312b]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-chaybook-primary text-white">
                    <UserRound aria-hidden="true" size={18} />
                  </span>
                  {article.createdBy != null ? `User ${article.createdBy}` : "—"}
                </span>
                <span className="hidden text-gray-300 sm:inline">|</span>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays aria-hidden="true" size={17} />
                  {formatArticleDate(article.createdAt)}
                </span>
              </div>
            </header>

            <div className="mb-5">
              <ArticleActions
                liked={liked}
                saved={saved}
                onLike={() => setLiked((current) => !current)}
                onSave={() => setSaved((current) => !current)}
                onShare={handleShare}
              />
              <p
                aria-live="polite"
                className="mt-2 min-h-5 text-xs text-[#6e7b6c]"
              >
                {actionFeedback}
              </p>
            </div>

            {article.coverImage ? (
              <img
                src={article.coverImage}
                alt={article.title || "Article cover"}
                className="mb-6 aspect-[16/7] w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="mb-6 flex aspect-[16/7] w-full items-center justify-center rounded-2xl bg-[#edf4ee] text-chaybook-primary">
                <FileText aria-hidden="true" size={36} />
              </div>
            )}

            <section aria-labelledby="article-content-heading" className="max-w-3xl">
              <h2
                id="article-content-heading"
                className="mb-3 text-xl font-bold text-[#181c1b]"
              >
                Chi tiết bài viết
              </h2>
              {article.content ? (
                <div className="whitespace-pre-line text-base leading-[1.8] text-[#3e4a3d]">
                  {article.content}
                </div>
              ) : null}
            </section>
          </article>

          <aside className="min-w-0 space-y-5 lg:col-span-4">
            <RelatedArticles
              articles={relatedArticles}
              loading={relatedLoading}
              error={relatedError}
            />
            <ArticleInformation
              article={article}
              categoryName={categoryName}
              categoryError={categoryError}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

function ContentPageDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [categories, setCategories] = useState([]);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [categoryError, setCategoryError] = useState(false);
  const [relatedError, setRelatedError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArticle() {
      let currentArticle = null;

      setLoading(true);
      setRelatedLoading(true);
      setCategoryError(false);
      setRelatedError(false);
      setError(null);
      setArticle(null);
      setCategories([]);
      setRelatedArticles([]);

      const articleId = Number(id);

      if (!Number.isInteger(articleId) || articleId <= 0) {
        setError("Invalid article ID");
        setLoading(false);
        setRelatedLoading(false);
        return;
      }

      try {
        const data = await getArticleDetail(articleId);

        if (cancelled) {
          return;
        }

        currentArticle = data;
        setArticle(data);
        setLoading(false);

        if (!data || typeof data !== "object") {
          setRelatedLoading(false);
          return;
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        console.error("Error fetching article detail:", requestError);
        setError(requestError.message || "Failed to fetch article detail");
        setLoading(false);
        setRelatedLoading(false);
        return;
      }

      const [categoryResult, articlesResult] = await Promise.allSettled([
        getCategories("ARTICLE"),
        getArticles(null, { status: "PUBLISHED" }),
      ]);

      if (cancelled) {
        return;
      }

      if (
        categoryResult.status === "fulfilled" &&
        Array.isArray(categoryResult.value)
      ) {
        setCategories(categoryResult.value);
      } else {
        const categoryRequestError =
          categoryResult.status === "rejected"
            ? categoryResult.reason
            : new TypeError("The category service returned an invalid response.");
        console.error("Error fetching article categories:", categoryRequestError);
        setCategoryError(true);
      }

      if (
        articlesResult.status === "fulfilled" &&
        Array.isArray(articlesResult.value)
      ) {
        const publishedArticles = articlesResult.value.filter(
          (item) =>
            item.status?.toUpperCase() === "PUBLISHED" &&
            Number(item.articleId) !== Number(id),
        );
        const sameCategoryArticles = publishedArticles.filter(
          (item) =>
            Number(item.categoryId) === Number(currentArticle.categoryId),
        );
        const otherArticles = publishedArticles.filter(
          (item) =>
            Number(item.categoryId) !== Number(currentArticle.categoryId),
        );

        setRelatedArticles(
          [...sameCategoryArticles, ...otherArticles].slice(0, 3),
        );
      } else {
        const articlesRequestError =
          articlesResult.status === "rejected"
            ? articlesResult.reason
            : new TypeError("The article service returned an invalid response.");
        console.error("Error fetching related articles:", articlesRequestError);
        setRelatedError(true);
      }

      setRelatedLoading(false);
    }

    loadArticle();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <section
        aria-label="Loading article"
        aria-live="polite"
        className="flex min-h-[55vh] w-full items-center justify-center px-4 py-16"
      >
        <div className="flex items-center gap-3 text-sm text-[#6e7b6c]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d8e4da] border-t-chaybook-primary" />
          Loading article detail...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        role="alert"
        className="mx-auto flex min-h-[55vh] w-full max-w-7xl flex-col items-center justify-center px-4 py-16 text-center"
      >
        <h1 className="text-2xl font-bold text-[#181c1b]">
          Error Loading Article
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[#6e7b6c]">
          {error}
        </p>
        <Link
          to="/content"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-chaybook-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chaybook-hover"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Back to Content
        </Link>
      </section>
    );
  }

  if (!article) {
    return (
      <section className="mx-auto flex min-h-[55vh] w-full max-w-7xl flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#181c1b]">
          Content Not Found
        </h1>
        <p className="mt-3 text-sm text-[#6e7b6c]">
          The content you are looking for does not exist.
        </p>
        <Link
          to="/content"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-chaybook-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chaybook-hover"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Back to Content
        </Link>
      </section>
    );
  }

  const categoryName =
    categories.find(
      (category) => Number(category.categoryId) === Number(article.categoryId),
    )?.name || "";

  return (
    <ArticleDetailView
      key={article.articleId}
      article={article}
      categoryName={categoryName}
      categoryError={categoryError}
      relatedArticles={relatedArticles}
      relatedLoading={relatedLoading}
      relatedError={relatedError}
    />
  );
}

export default ContentPageDetail;
