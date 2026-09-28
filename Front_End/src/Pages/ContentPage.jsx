import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  Leaf,
  BookOpen,
  MessageCircle,
  Search,
  Timer,
} from "lucide-react";

import Input from "../components/common/Input";
import Button from "../components/common/Button";

import { posts } from "../data/contentData";

// =========================
// DATA
// =========================

const categories = [
  { id: "all", label: "All" },
  { id: "recipes", label: "Recipes" },
  { id: "nutrition", label: "Nutrition" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "tips", label: "Tips" },
];

// =========================
// STYLES
// =========================

const categoryStyles = {
  recipes: {
    text: "text-[#006d30]",
    dot: "bg-[#006b2c]",
  },
  nutrition: {
    text: "text-[#466252]",
    dot: "bg-[#5e7b6a]",
  },
  lifestyle: {
    text: "text-[#3e4a3d]",
    dot: "bg-[#6e7b6c]",
  },
  tips: {
    text: "text-[#006b2c]",
    dot: "bg-[#62df7d]",
  },
};

const authorStyles = {
  primary: "bg-[#006b2c] text-white",
  secondary: "bg-[#006d30] text-white",
  tertiary: "bg-[#466252] text-white",
  "tertiary-container": "bg-[#5e7b6a] text-[#f6fff6]",
};

const durationIcons = {
  timer: Timer,
  book: BookOpen,
};

// =========================
// CATEGORY FILTER
// =========================

function CategoryFilter({ activeCategory, onCategoryChange }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {categories.map((category) => {
        const isActive = activeCategory === category.id;

        return (
          <Button
            key={category.id}
            type="button"
            size="sm"
            variant={isActive ? "primary" : "outline"}
            onClick={() => onCategoryChange(category.id)}
            className={
              isActive
                ? "rounded-full bg-chaybook-primary px-4 py-1 text-sm text-white hover:bg-chaybook-hover"
                : "rounded-full bg-white px-4 py-1 text-sm text-black hover:bg-chaybook-primary hover:text-white"
            }
          >
            {category.label}
          </Button>
        );
      })}
    </div>
  );
}

// =========================
// POST CARD
// =========================

function PostCard({ post }) {
  const DurationIcon = durationIcons[post.durationIcon] || Timer;
  const categoryStyle = categoryStyles[post.category] || categoryStyles.recipes;
  const authorStyle = authorStyles[post.authorColor] || authorStyles.primary;

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-xl">
      <div>
        {/* Image */}
        <div className="relative aspect-16/10 overflow-hidden bg-[#ebefec]">
          <img
            src={post.image}
            alt={post.imageAlt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <span
            className={`absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-md ${categoryStyle.text}`}
          >
            <span className={`h-2 w-2 rounded-full ${categoryStyle.dot}`} />
            {post.categoryLabel}
          </span>

          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-[#2d3130]/80 px-2 py-1 text-[11px] font-medium text-[#eef1ee] backdrop-blur-md">
            <DurationIcon size={14} />
            {post.duration}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 pb-2">
          <h2 className="mb-2 line-clamp-2 text-lg font-semibold leading-6.5 text-[#181c1b] transition-colors group-hover:text-chaybook-primary">
            {post.title}
          </h2>

          <p className="mb-4 line-clamp-2 text-[13px] leading-5 text-[#3e4a3d]">
            {post.description}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-1">
        <div className="mb-2 flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${authorStyle}`}
            >
              {post.initials}
            </div>

            <div>
              <p className="text-xs font-semibold text-[#181c1b]">
                {post.author}
              </p>

              <p className="text-[11px] font-medium text-[#3e4a3d]">
                {post.authorRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-medium text-[#3e4a3d]">
            {post.calories && (
              <>
                <span className="flex items-center gap-0.5">
                  <Flame size={14} />
                  {post.calories}
                </span>
                <span>·</span>
              </>
            )}

            <span className="flex items-center gap-0.5">
              <MessageCircle size={14} />
              {post.comments}
            </span>
          </div>
        </div>

        <div className="-mx-6 -mb-6 flex items-center justify-between bg-chaybook-container px-6 py-2">
          <span className="text-[11px] font-medium text-[#3e4a3d]">
            {post.date}
          </span>

          <Link
            to={`/content/${post.id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-chaybook-primary transition-colors hover:text-chaybook-hover"
          >
            {post.action}
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

function Pagination() {
  const [currentPage, setCurrentPage] = useState(1);

  const pages = [1, 2, 3];

  return (
    <div className="flex flex-col items-center justify-between gap-4 pb-12 pt-2 sm:flex-row">
      <p className="text-[13px] text-[#3e4a3d]">
        Showing{" "}
        <span className="font-semibold text-[#181c1b]">
          {currentPage === 1
            ? "1–6"
            : `${(currentPage - 1) * 6 + 1}–${currentPage * 6}`}
        </span>{" "}
        of <span className="font-semibold text-[#181c1b]">48</span> articles
      </p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          className="h-10 w-10 p-0"
        >
          <ChevronLeft size={18} />
        </Button>

        {pages.map((page) => (
          <Button
            key={page}
            type="button"
            size="sm"
            variant={currentPage === page ? "primary" : "outline"}
            onClick={() => setCurrentPage(page)}
            className={`h-10 w-10 p-0 ${
              currentPage === page
                ? "bg-chaybook-primary text-white"
                : "bg-white text-black hover:bg-[#ebefec]"
            }`}
          >
            {page}
          </Button>
        ))}

        <span className="px-1 text-sm font-semibold text-[#6e7b6c]">…</span>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setCurrentPage((page) => Math.min(8, page + 1))}
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
// NEWSLETTER
// =========================

// function NewsletterBanner() {
//   const [email, setEmail] = useState("");
//   const [submitted, setSubmitted] = useState(false);

//   const handleSubmit = (event) => {
//     event.preventDefault();

//     if (!email.trim()) return;

//     setSubmitted(true);
//     setEmail("");
//   };

//   return (
//     <section className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-xl bg-[#92f5a4] p-6 shadow-sm sm:p-8 md:flex-row lg:p-12">
//       <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-[#62df7d]/30 blur-3xl" />

//       <div className="relative z-10 max-w-xl text-center md:text-left">
//         <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#007233] shadow-sm">
//           <Mail size={16} />
//           Weekly Plant Wisdom
//         </div>

//         <h3 className="mb-1 text-[28px] font-bold leading-9 tracking-tight text-[#00210a]">
//           Get wholesome seasonal recipes directly in your inbox.
//         </h3>

//         <p className="text-[15px] leading-6 text-[#3e4a3d]">
//           No spam, ever. Just dietitian-reviewed meal prep ideas, mindful
//           lifestyle essays, and nutritional deep dives every Thursday.
//         </p>
//       </div>

//       <div className="relative z-10 w-full shrink-0 md:w-auto">
//         <form
//           onSubmit={handleSubmit}
//           className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
//         >
//           <Input
//             type="email"
//             placeholder="Enter your email address..."
//             value={email}
//             onChange={(event) => {
//               setEmail(event.target.value);
//               setSubmitted(false);
//             }}
//             className="h-11 min-w-0 border-none shadow-sm sm:min-w-60"
//           />

//           <Button
//             type="submit"
//             size="md"
//             className="h-11 whitespace-nowrap bg-chaybook-primary px-6 hover:bg-chaybook-hover"
//           >
//             Subscribe Free
//           </Button>
//         </form>

//         <p className="mt-1 text-center text-[11px] font-medium text-[#3e4a3d] md:text-left">
//           {submitted
//             ? "Thanks for subscribing!"
//             : "Join 24,000+ mindful home chefs and wellness seekers."}
//         </p>
//       </div>
//     </section>
//   );
// }

// =========================
// CONTENT PAGE
// =========================

function ContentPage() {
  const [activeCategory, setActiveCategory] = useState("recipes");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === "all" || post.category === activeCategory;

      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        post.categoryLabel.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("all");
  };

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

            <h1 className="mb-2 max-w-2xl text-[28px] font-bold leading-9 tracking-tight sm:text-[36px] sm:leading-11 text-chaybook-primary">
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
                onChange={(event) => setSearchQuery(event.target.value)}
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
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </section>

          {/* Posts */}
          {filteredPosts.length > 0 ? (
            <section
              aria-label="Posts"
              className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
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
          <Pagination />
        </div>
      </main>
    </div>
  );
}

export default ContentPage;
