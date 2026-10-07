import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Leaf,
  MessageCircle,
  Search,
  Timer,
} from "lucide-react";

import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { getArticles } from "../services/articleServices";
import { getCategories } from "../services/categoryServices";

// =========================
// CATEGORY FILTER
// =========================

function CategoryFilter({ activeCategoryId, categories, onCategoryChange }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={activeCategoryId === null ? "primary" : "outline"}
        onClick={() => onCategoryChange(null)}
        className={
          activeCategoryId === null
            ? "rounded-full bg-chaybook-primary px-4 py-1 text-sm text-white hover:bg-chaybook-hover"
            : "rounded-full bg-white px-4 py-1 text-sm text-black hover:bg-chaybook-primary hover:text-white"
        }
      >
        All
      </Button>

      {categories.map((category) => {
        const isActive =
          Number(activeCategoryId) === Number(category.categoryId);

        return (
          <Button
            key={category.categoryId}
            type="button"
            size="sm"
            variant={isActive ? "primary" : "outline"}
            onClick={() => onCategoryChange(category.categoryId)}
            className={
              isActive
                ? "rounded-full bg-chaybook-primary px-4 py-1 text-sm text-white hover:bg-chaybook-hover"
                : "rounded-full bg-white px-4 py-1 text-sm text-black hover:bg-chaybook-primary hover:text-white"
            }
          >
            {category.name}
          </Button>
        );
      })}
    </div>
  );
}

// =========================
// POST CARD
// =========================

function PostCard({ post, categoriesMap }) {
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("vi-VN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const categoryName = categoriesMap.get(Number(post.categoryId)) || "Category";

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-xl">
      <div>
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-[#ebefec]">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title || "Article"}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#ebefec] text-[#6e7b6c]">
              No Image
            </div>
          )}

          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#006b2c] shadow-sm backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#006b2c]" />
            <span className="ml-1">{categoryName}</span>
          </span>

          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-[#2d3130]/80 px-2 py-1 text-[11px] font-medium text-[#eef1ee] backdrop-blur-md">
            <Timer size={14} />
            {formatDate(post.createdAt)}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 pb-2">
          <h2 className="mb-2 line-clamp-2 text-lg font-semibold leading-6 text-[#181c1b] transition-colors group-hover:text-chaybook-primary">
            {post.title || "Untitled Article"}
          </h2>

          {post.content ? (
            <p className="mb-4 line-clamp-2 text-[13px] leading-5 text-[#3e4a3d]">
              {post.content.length > 100
                ? `${post.content.substring(0, 100)}...`
                : post.content}
            </p>
          ) : (
            <p className="mb-4 line-clamp-2 text-[13px] leading-5 text-[#3e4a3d]">
              No content available
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-1">
        <div className="mb-2 flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#006b2c] text-xs font-bold text-white">
              CB
            </div>

            <div>
              <p className="text-xs font-semibold text-[#181c1b]">
                ChayBook Team
              </p>
              <p className="text-[11px] font-medium text-[#3e4a3d]">Author</p>
            </div>
          </div>
        </div>

        <div className="-mx-6 -mb-6 flex items-center justify-between bg-chaybook-container px-6 py-2">
          <span className="text-[11px] font-medium text-[#3e4a3d]">
            {formatDate(post.createdAt)}
          </span>

          <Link
            to={`/content/${post.articleId}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-chaybook-primary transition-colors hover:text-chaybook-hover"
          >
            Read Article
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

// =========================
// PAGINATION
// =========================

function Pagination({
  currentPage,
  totalItems,
  itemsPerPage = 6,
  onPageChange,
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const pageNumbers = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1);

    if (currentPage > 3) {
      pageNumbers.push(-1);
    }

    const startPage = Math.max(2, Math.min(currentPage - 1, totalPages - 2));

    const endPage = Math.min(totalPages - 1, Math.max(currentPage + 1, 3));

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (currentPage < totalPages - 2) {
      pageNumbers.push(-2);
    }

    pageNumbers.push(totalPages);
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-4 pb-12 pt-2 sm:flex-row">
      <p className="text-[13px] text-[#3e4a3d]">
        Showing{" "}
        <span className="font-semibold text-[#181c1b]">
          {startItem}-{endItem}
        </span>{" "}
        of <span className="font-semibold text-[#181c1b]">{totalItems}</span>{" "}
        articles
      </p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="h-10 w-10 p-0"
        >
          <ChevronLeft size={18} />
        </Button>

        {pageNumbers.map((page, index) => {
          if (page < 0) {
            return (
              <span
                key={`ellipsis-${page}`}
                className="px-1 text-sm font-semibold text-[#6e7b6c]"
              >
                …
              </span>
            );
          }

          return (
            <Button
              key={`${page}-${index}`}
              type="button"
              size="sm"
              variant={currentPage === page ? "primary" : "outline"}
              onClick={() => onPageChange(page)}
              className={`h-10 w-10 p-0 ${
                currentPage === page
                  ? "bg-chaybook-primary text-white"
                  : "bg-white text-black hover:bg-[#ebefec]"
              }`}
            >
              {page}
            </Button>
          );
        })}

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="h-10 px-4"
        >
          Next
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
}

// =========================
// CONTENT PAGE
// =========================

function ContentPage() {
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const itemsPerPage = 6;

  // Category ID -> Category name
  const categoriesMap = useMemo(() => {
    return new Map(
      categories.map((category) => [
        Number(category.categoryId),
        category.name,
      ]),
    );
  }, [categories]);

  // Fetch categories
  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const data = await getCategories("ARTICLE");

        if (!cancelled) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);

        if (!cancelled) {
          setCategories([]);
        }
      }
    }

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch articles when category, page, or retry changes
  useEffect(() => {
    let cancelled = false;

    async function loadArticles() {
      try {
        const pageIndex = currentPage - 1; // Convert to zero-based for API
        const data = await getArticles(activeCategoryId ?? null, pageIndex, itemsPerPage);

        if (!cancelled) {
          // data is PageResponse: { content, page, size, totalElements, totalPages }
          setArticles(Array.isArray(data.content) ? data.content : []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching articles:", err);
          setError(err.message || "Failed to fetch articles");
          setArticles([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadArticles();

    return () => {
      cancelled = true;
    };
  }, [activeCategoryId, currentPage, retryCount]);

  // Filter articles by search and category
  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return articles.filter((article) => {
      const categoryName = categoriesMap.get(Number(article.categoryId)) || "";

      const matchesCategory =
        activeCategoryId === null ||
        Number(article.categoryId) === Number(activeCategoryId);

      const matchesSearch =
        !query ||
        (article.title || "").toLowerCase().includes(query) ||
        (article.content || "").toLowerCase().includes(query) ||
        categoryName.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategoryId, searchQuery, articles, categoriesMap]);

  // Change category and reset pagination
  const handleCategoryChange = (categoryId) => {
    setCurrentPage(1);

    if (categoryId !== activeCategoryId) {
      setLoading(true);
      setError(null);
      setActiveCategoryId(categoryId);
    }
  };

  // Search locally and reset pagination
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Retry loading articles
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount((count) => count + 1);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setCurrentPage(1);
    handleCategoryChange(null);
  };

  // Current page's articles (already paginated by server, just filter for search)
  const paginatedPosts = useMemo(() => {
    return filteredPosts;
  }, [filteredPosts]);

  return (
    <div className="min-h-screen bg-chaybook-bg font-sans text-[#181c1b] antialiased">
      <main className="w-full bg-chaybook-container pt-20">
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-12">
          {/* Hero */}
          <section className="relative z-10 mb-12 flex flex-col items-center text-center sm:mb-16">
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#92f5a4] px-3 py-1 text-xs font-semibold tracking-wide text-[#007233]">
              <Leaf size={16} fill="currentColor" />
              Curated Plant-Based Living
            </span>

            <h1 className="mb-2 max-w-2xl text-[28px] font-bold leading-9 tracking-tight text-chaybook-primary sm:text-[36px] sm:leading-11">
              Explore Our Posts
            </h1>

            <p className="mb-8 max-w-xl text-base leading-7 text-[#3e4a3d] sm:text-lg">
              Discover healthy recipes, nutrition tips, and inspiration for a
              better vegetarian lifestyle.
            </p>

            {/* Search */}
            <form
              onSubmit={(event) => event.preventDefault()}
              className="mb-6 flex w-full max-w-2xl items-center gap-2 rounded-xl bg-white p-1 shadow-sm focus-within:shadow-md"
            >
              <Input
                type="search"
                icon={Search}
                placeholder="Search posts, recipes, tips..."
                value={searchQuery}
                onChange={(event) => handleSearchChange(event.target.value)}
                className="border-none bg-transparent shadow-none focus:ring-0"
              />

              <Button
                type="submit"
                size="md"
                className="shrink-0 bg-chaybook-primary px-6 hover:bg-chaybook-hover"
              >
                Search
              </Button>
            </form>

            <CategoryFilter
              activeCategoryId={activeCategoryId}
              categories={categories}
              onCategoryChange={handleCategoryChange}
            />
          </section>

          {/* Posts */}
          {loading ? (
            <section className="mb-12 flex min-h-75 flex-col items-center justify-center rounded-xl bg-white p-8 text-center shadow-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-chaybook-primary" />
              <p className="mt-4 text-[15px] leading-6 text-[#3e4a3d]">
                Loading articles...
              </p>
            </section>
          ) : error ? (
            <section className="mb-12 flex min-h-75 flex-col items-center justify-center rounded-xl bg-white p-8 text-center shadow-sm">
              <MessageCircle
                size={40}
                className="mb-4 text-[#6e7b6c]"
                strokeWidth={1.5}
              />

              <h2 className="mb-2 text-[22px] font-semibold">
                Error loading articles
              </h2>

              <p className="max-w-md text-[15px] leading-6 text-[#3e4a3d]">
                {error}
              </p>

              <Button
                type="button"
                size="md"
                variant="outline"
                onClick={handleRetry}
                className="mt-5 bg-chaybook-primary hover:bg-chaybook-hover"
              >
                Try again
              </Button>
            </section>
          ) : paginatedPosts.length > 0 ? (
            <section
              aria-label="Posts"
              className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {paginatedPosts.map((post) => (
                <PostCard
                  key={post.articleId}
                  post={post}
                  categoriesMap={categoriesMap}
                />
              ))}
            </section>
          ) : (
            <section className="mb-12 flex min-h-75 flex-col items-center justify-center rounded-xl bg-white p-8 text-center shadow-sm">
              <Search
                size={40}
                className="mb-4 text-[#6e7b6c]"
                strokeWidth={1.5}
              />

              <h2 className="mb-2 text-[22px] font-semibold">No posts found</h2>

              <p className="max-w-md text-[15px] leading-6 text-[#3e4a3d]">
                Try another search keyword or select a different category.
              </p>

              <Button
                type="button"
                size="md"
                variant="outline"
                onClick={clearFilters}
                className="mt-5 bg-chaybook-primary hover:bg-chaybook-hover"
              >
                Clear filters
              </Button>
            </section>
          )}

          {!loading && !error && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalElements}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default ContentPage;
