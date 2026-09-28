import { useMemo, useState } from "react";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  Leaf,
  BookOpen,
  MessageCircle,
<<<<<<< HEAD
  PersonStanding,
  Rss,
=======
>>>>>>> ceb409d6c4b49bbad479eaf590c443f81fdfe665
  Search,
  Timer,
} from "lucide-react";

<<<<<<< HEAD
import { getContentList } from "./mocks/contentData";

const logoUrl =
  "https://lh3.googleusercontent.com/aida/AEtjO1VKv3kDYidvSLgjsjwk42tUI5A_ir1KG91CD1IqeBkKLqdAoaitt6UDGv-ZEyyCvlqz23nqpFNy78oD7AkccAy7oZiihRuffEd1YuUaKUmgevykqdgybf1Dvw52_vJNZj49VuZD3T2pA68KazIDEdm4TBoozvF8lWLZCQ0pwfPixoiZC014Udd4CT1u4hg2pXWf9oUOFevg-6s5CSsk5pQsX7T_EQ45WHUozJKYhQZqnEhLYzT1tFql7w0";
=======
import Input from "../components/common/Input";
import Button from "../components/common/Button";

import { posts } from "../data/contentData";

// =========================
// DATA
// =========================
>>>>>>> ceb409d6c4b49bbad479eaf590c443f81fdfe665

const categories = [
  { id: "all", label: "All" },
  { id: "recipes", label: "Recipes" },
  { id: "nutrition", label: "Nutrition" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "tips", label: "Tips" },
];

<<<<<<< HEAD
const footerColumns = [
  {
    title: "Explore",
    links: [
      "Recipes & Discovery",
      "Nutrition Guides",
      "Meal Prep Collections",
      "Pantry Essentials",
    ],
  },
  {
    title: "Interactive Tools",
    links: [
      "AI Nutrition Assistant",
      "BMI & Health Gauge",
      "Macronutrient Calculator",
      "Weekly Meal Planner",
    ],
  },
  {
    title: "Community & Support",
    links: [
      "Member Forum",
      "Donate & Support Us",
      "21-Day Veg Challenge",
      "Help Center & FAQs",
    ],
  },
];

const iconMap = {
  timer: Timer,
  book: MenuBook,
};
=======
// =========================
// STYLES
// =========================
>>>>>>> ceb409d6c4b49bbad479eaf590c443f81fdfe665

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

<<<<<<< HEAD
  const navItems = [
    { label: "Home", path: "/" },
    { label: "Content", path: "/content", active: true },
    { label: "AI ChatBox", path: "/ai-chatbox" },
    { label: "BMI Analyse", path: "/bmi-analyse" },
    { label: "Donate", path: "/donate" },
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-[#e0e3e0] bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-12">
        <div className="flex items-center gap-6">
          <a
            href="/"
            className="flex shrink-0 items-center gap-2"
            aria-label="ChayBook home"
          >
            <img
              src={logoUrl}
              alt="ChayBook logo"
              className="h-8 w-auto object-contain"
            />

            <span className="text-[18px] font-bold tracking-tight text-[#006b2c]">
              ChayBook
            </span>
          </a>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.path}
                aria-current={item.active ? "page" : undefined}
                className={
                  item.active
                    ? "rounded-lg bg-[#92f5a4] px-3 py-1 text-[14px] font-semibold leading-5 text-[#007233] transition-colors"
                    : "rounded-lg px-3 py-1 text-[14px] font-semibold leading-5 text-[#3e4a3d] transition-colors hover:text-[#181c1b]"
                }
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#3e4a3d] transition-colors hover:bg-[#ebefec] hover:text-[#181c1b]"
          >
            <Search size={20} strokeWidth={2} />
          </button>

          <button
            type="button"
            aria-label="Bookmarks"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#3e4a3d] transition-colors hover:bg-[#ebefec] hover:text-[#181c1b]"
          >
            <Bookmark size={20} strokeWidth={2} />
          </button>

          <div className="hidden items-center gap-2 rounded-full border border-[#bdcaba] bg-[#f1f4f1] py-1 pl-1 pr-3 lg:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#006b2c]">
              <PersonStanding size={18} className="text-white" />
            </div>

            <div className="flex flex-col text-left">
              <span className="text-[12px] font-semibold leading-4 text-[#181c1b]">
                Sarah Green
              </span>

              <span className="text-[11px] font-medium leading-[14px] text-[#3e4a3d]">
                Plant-based Dietitian
              </span>
            </div>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#006b2c] lg:hidden">
            <PersonStanding size={18} className="text-white" />
          </div>

          <button
            type="button"
            aria-label="Logout"
            className="rounded-lg p-2 text-[#3e4a3d] transition-colors hover:bg-[#ebefec] hover:text-[#ba1a1a]"
          >
            <LogOut size={20} strokeWidth={2} />
          </button>

          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsMobileMenuOpen((previous) => !previous)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#3e4a3d] transition-colors hover:bg-[#ebefec] md:hidden"
          >
            {isMobileMenuOpen ? (
              <X size={20} />
            ) : (
              <MenuBook size={20} />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav
          className="border-t border-[#e0e3e0] bg-white px-4 py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto flex max-w-[1280px] flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={
                  item.active
                    ? "rounded-lg bg-[#92f5a4] px-4 py-3 text-sm font-semibold text-[#007233]"
                    : "rounded-lg px-4 py-3 text-sm font-semibold text-[#3e4a3d] hover:bg-[#ebefec]"
                }
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
=======
// =========================
// CATEGORY FILTER
// =========================
>>>>>>> ceb409d6c4b49bbad479eaf590c443f81fdfe665

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
<<<<<<< HEAD
            aria-pressed={isActive}
            className={`flex items-center gap-1 rounded-full px-4 py-1 text-[14px] font-semibold leading-5 shadow-sm transition-colors ${
              isActive
                ? "bg-[#006b2c] text-white"
                : "bg-white text-[#3e4a3d] hover:bg-[#ebefec]"
            }`}
=======
            className={
              isActive
                ? "rounded-full bg-chaybook-primary px-4 py-1 text-sm text-white hover:bg-chaybook-hover"
                : "rounded-full bg-white px-4 py-1 text-sm text-black hover:bg-chaybook-primary hover:text-white"
            }
>>>>>>> ceb409d6c4b49bbad479eaf590c443f81fdfe665
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
<<<<<<< HEAD
            <span
              className={`h-2 w-2 rounded-full ${categoryStyle.dot}`}
            />

=======
            <span className={`h-2 w-2 rounded-full ${categoryStyle.dot}`} />
>>>>>>> ceb409d6c4b49bbad479eaf590c443f81fdfe665
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

          <a
<<<<<<< HEAD
            href={`/content/${post.slug}`}
            className="inline-flex items-center gap-1 text-[14px] font-semibold leading-5 text-[#006b2c] transition-colors hover:text-[#00873a]"
=======
            href={`/content/${post.id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-chaybook-primary transition-colors hover:text-chaybook-hover"
>>>>>>> ceb409d6c4b49bbad479eaf590c443f81fdfe665
          >
            {post.action}
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>
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
<<<<<<< HEAD
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-[14px] font-semibold leading-5 shadow-sm transition-colors ${
              currentPage === page
                ? "bg-[#006b2c] text-white"
                : "bg-white text-[#181c1b] hover:bg-[#ebefec]"
=======
            className={`h-10 w-10 p-0 ${
              currentPage === page
                ? "bg-chaybook-primary text-white"
                : "bg-white text-black hover:bg-[#ebefec]"
>>>>>>> ceb409d6c4b49bbad479eaf590c443f81fdfe665
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
<<<<<<< HEAD
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const posts = getContentList();
=======
    const query = searchQuery.trim().toLowerCase();
>>>>>>> ceb409d6c4b49bbad479eaf590c443f81fdfe665

    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === "all" ||
        post.category === activeCategory;

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
<<<<<<< HEAD
                <div className="flex items-center justify-center pl-3 text-[#6e7b6c]">
                  <Search size={24} strokeWidth={2} />
                </div>

                <label htmlFor="postSearchInput" className="sr-only">
                  Search posts
                </label>

                <input
                  id="postSearchInput"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search posts, recipes, tips..."
                  className="h-11 w-full bg-transparent text-[15px] font-normal leading-6 text-[#181c1b] outline-none placeholder:text-[#6e7b6c]"
                />

                <button
                  type="submit"
                  className="h-11 shrink-0 rounded-lg bg-[#006b2c] px-6 text-[14px] font-semibold leading-5 text-white transition-colors hover:bg-[#00873a]"
                >
                  Search
                </button>
              </form>

              <CategoryFilter
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
=======
                Clear filters
              </Button>
>>>>>>> ceb409d6c4b49bbad479eaf590c443f81fdfe665
            </section>
          )}
          <Pagination />
        </div>
      </main>
    </div>
  );
}
<<<<<<< HEAD
=======

export default ContentPage;
>>>>>>> ceb409d6c4b49bbad479eaf590c443f81fdfe665
