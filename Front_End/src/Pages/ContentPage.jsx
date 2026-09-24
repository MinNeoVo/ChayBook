import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Flame,
  Leaf,
  LogOut,
  Mail,
  MenuBook,
  MessageCircle,
  Newspaper,
  PersonStanding,
  Rss,
  Search,
  Timer,
  Globe,
  X,
} from "lucide-react";

const logoUrl =
  "https://lh3.googleusercontent.com/aida/AEtjO1VKv3kDYidvSLgjsjwk42tUI5A_ir1KG91CD1IqeBkKLqdAoaitt6UDGv-ZEyyCvlqz23nqpFNy78oD7AkccAy7oZiihRuffEd1YuUaKUmgevykqdgybf1Dvw52_vJNZj49VuZD3T2pA68KazIDEdm4TBoozvF8lWLZCQ0pwfPixoiZC014Udd4CT1u4hg2pXWf9oUOFevg-6s5CSsk5pQsX7T_EQ45WHUozJKYhQZqnEhLYzT1tFql7w0";

const categories = [
  {
    id: "all",
    label: "All",
  },
  {
    id: "recipes",
    label: "Recipes",
    activeDot: true,
  },
  {
    id: "nutrition",
    label: "Nutrition",
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
  },
  {
    id: "tips",
    label: "Tips",
  },
];

const posts = [
  {
    id: 1,
    category: "recipes",
    categoryLabel: "Recipes",
    categoryColor: "secondary",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1UmS85DWMio266GaCmBtoF5p2SbdcO-D7YXEYhjqB2bMqDjA8eeyu8SBYPi3YX9xW_DldcWAqyznz_bKUv7B1lrtk9CGVucoF_hES-abjw8Vwjt76bdkvM_MasS8akxPrNQTBGjsc0M-fF21QL0AI-MkdCTq5dZWs57F2BthWk3iFciw5sVVacB_bF8zBu2TNtClZ4oDcmbTq9JASYh-Ssi6LQFOKZQBh0LBLToo_LDPPUfeMl7fVASIw",
    imageAlt: "Avocado Quinoa Salad",
    title:
      "Avocado Quinoa Salad – A healthy, easy-to-make vegetarian meal at home",
    description:
      "A colorful, nutrient-packed bowl full of fresh vegetables, quinoa and a zesty tahini dressing. Perfect for lunch!",
    author: "Sarah Green",
    authorRole: "Dietitian",
    initials: "SG",
    authorColor: "primary",
    calories: "495 kcal",
    comments: 24,
    date: "Apr 12, 2024",
    duration: "15 min prep",
    durationIcon: "timer",
    action: "Read Recipe",
  },
  {
    id: 2,
    category: "recipes",
    categoryLabel: "Recipes",
    categoryColor: "secondary",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1VdoBwdTrLghRZZ_PtVBBlZ89DAvHTxETbhzjwbR3Ztnxx9IsbpW1-HWpGK6kQFqIzAVK0lr9gT1UbLdIQDtnjNsIVAyALcNWMopB_RFFYcR44Ze06IDeZ9QvplZy5O8iJOSZ6TFQKXTtAvf8QpVrBAOirrER8hUAwPt12b2gMcbBfe4sLtxn-ZJUacgil9zs1vbEzwfSf7DZhZ1xp2JtJROSUxvg8gjmWmqaNeqGVZGICrS--aSkdKUlo",
    imageAlt: "Fresh Homemade Avocado Sourdough with Microgreens",
    title: "Fresh Homemade Avocado Sourdough with Microgreens",
    description:
      "Loaded with monounsaturated healthy fats, crunchy radish, and living microgreen enzymes for vital mornings.",
    author: "Sarah Green",
    authorRole: "Dietitian",
    initials: "SG",
    authorColor: "primary",
    calories: "320 kcal",
    comments: 18,
    date: "Apr 10, 2024",
    duration: "10 min",
    durationIcon: "timer",
    action: "Read Recipe",
  },
  {
    id: 3,
    category: "nutrition",
    categoryLabel: "Nutrition",
    categoryColor: "tertiary",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1V0eAO_LvyrGJcFiQB34FJw4nozoRO_veC_LMZNMCoM-hsyU8LQFcPaqbMRHvjXXQ7nrROnEbcWe2bNjYXms1Axu-WXuIyYcWZYzgaupKO7-pRICvxaUG2l8IuLTk7JgwPqfYpVN9cCo1Ud6mb6j5A-YGzx3QGICOrpO2tZx5bcOiNBaOJ7t28eiWzbLsigjDh1CvTEmNJiZE-aWG-xqrhwFfLg6eIngtfZPcvMo6xEwZeqUzxRdhQUW1M",
    imageAlt: "Creamy Roasted Pumpkin Ginger Soup with Pepitas",
    title: "Creamy Roasted Pumpkin Ginger Soup with Pepitas",
    description:
      "Warm anti-inflammatory comfort bowl slow-simmered with coconut milk, turmeric, and toasted pumpkin seeds.",
    author: "Dr. Elena Rostova",
    authorRole: "Nutritionist",
    initials: "ER",
    authorColor: "tertiary",
    calories: "210 kcal",
    comments: 32,
    date: "Apr 08, 2024",
    duration: "25 min",
    durationIcon: "timer",
    action: "Read Guide",
  },
  {
    id: 4,
    category: "recipes",
    categoryLabel: "Recipes",
    categoryColor: "secondary",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCZSGiIGGjN8CjLlk3LP3FeMMMXQGAaj0xartwNFiRVf_vU6A6BeIQXIpRQsI-W5Ljc2K_-3lh-KLZwXpN-ADBFkJkCGxVMGaKZoPJk_j1qTwx7_9CO-kVOltKdBms-8I_RuRM4WBPNp8Ck999j2-zM4OrI2IQN8WVmfsqpkz7EEbkzSakqe9j8oti5YpYm89VkX2lxNbhSOP5TX5EOyyaWjetfblNC7DEzGNA36Dhk3dEOHGoHmb3s",
    imageAlt: "Crisp Summer Spring Rolls with Zesty Peanut Dip",
    title: "Crisp Summer Spring Rolls with Zesty Peanut Dip",
    description:
      "Refreshing rice paper rolls packed with crisp cucumber, mint, carrots, and vermicelli with rich peanut dip.",
    author: "Tien Nguyen",
    authorRole: "Culinary Lead",
    initials: "TN",
    authorColor: "secondary",
    calories: "280 kcal",
    comments: 14,
    date: "Apr 05, 2024",
    duration: "20 min",
    durationIcon: "timer",
    action: "Read Recipe",
  },
  {
    id: 5,
    category: "lifestyle",
    categoryLabel: "Lifestyle",
    categoryColor: "lifestyle",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCLEIrN9wQ2uGj1OP6aezuzV2YQn0RpoIk-aNBblA5CqQZBkB9jtCwePqWayvgl1q_xOdv4VTEoo96Lq9hMm_CdMkU7tFQF0nN8k2wONk3rbXSveCzaeBtfJYU7U9WgtOg_xiTwZmynCHXDQx3-hhbn_lQdv_2TdolhwJWZd75IVllKaJALTVlBK4Hj84OBjB0fEIVE-M6LAglc8JYjDihwVTpP6xETydFW8iUq7x24WpLzKmpNcpxg",
    imageAlt: "Mediterranean Herb Garden Salad with Kalamata Olives",
    title: "Mediterranean Herb Garden Salad with Kalamata Olives",
    description:
      "Sun-ripened organic tomatoes, crisp Persian cucumbers, oregano-infused cold-pressed olive oil, and plant feta.",
    author: "Marcus Vance",
    authorRole: "Holistic Coach",
    initials: "MV",
    authorColor: "tertiary-container",
    calories: "240 kcal",
    comments: 19,
    date: "Apr 03, 2024",
    duration: "12 min",
    durationIcon: "timer",
    action: "Read Story",
  },
  {
    id: 6,
    category: "tips",
    categoryLabel: "Tips",
    categoryColor: "primary",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1VTLHEzsp0n2ra6xBNduvIDDgPZ76VrN-cr43gmM8kp8WasUNdFB-ioeyQszojmDC3t3xmS8H_BPMJUgnGCSbFyQJYNkzp3Pi-XR4DFMK_douWI32E9NlOek1DxwgtYTS6jrkVW43i3xgZttabm-s1HHss0UFlU5N-_DVmV1c3m0TL_6NtuFtf3WEWob4cIZzzzPWbA2m_kOZhu4NBcsYns5MN8d4xk_SL5g0SW0Ok5LJxThdMaE7Gba90",
    imageAlt: "The Complete Guide to High-Protein Vegetarian Meal Prepping",
    title: "The Complete Guide to High-Protein Vegetarian Meal Prepping",
    description:
      "How to batch-cook balanced macro grain bowls with diverse plant proteins to save time during busy workweeks.",
    author: "Sarah Green",
    authorRole: "Dietitian",
    initials: "SG",
    authorColor: "primary",
    calories: null,
    comments: 42,
    date: "Mar 28, 2024",
    duration: "8 min read",
    durationIcon: "book",
    action: "Read Guide",
  },
];

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

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
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
            {isMobileMenuOpen ? <X size={20} /> : <MenuBook size={20} />}
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

function CategoryFilter({ activeCategory, onCategoryChange }) {
  return (
    <nav
      aria-label="Category filters"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {categories.map((category) => {
        const isActive = activeCategory === category.id;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(category.id)}
            aria-pressed={isActive}
            className={`flex items-center gap-1 rounded-full px-4 py-1 text-[14px] font-semibold leading-5 shadow-sm transition-colors ${isActive
              ? "bg-[#006b2c] text-white"
              : "bg-white text-[#3e4a3d] hover:bg-[#ebefec]"
              }`}
          >
            {isActive && category.id !== "all" && (
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            )}

            {category.label}
          </button>
        );
      })}
    </nav>
  );
}

function PostCard({ post }) {
  const DurationIcon = iconMap[post.durationIcon] || Timer;

  const categoryStyle =
    categoryStyles[post.category] || categoryStyles.recipes;

  const authorStyle =
    authorStyles[post.authorColor] || authorStyles.primary;

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-xl">
      <div>
        <div className="relative aspect-[16/10] overflow-hidden bg-[#ebefec]">
          <img
            src={post.image}
            alt={post.imageAlt}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          <span
            className={`absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold leading-4 shadow-sm backdrop-blur-md ${categoryStyle.text}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${categoryStyle.dot}`}
            />
            {post.categoryLabel}
          </span>

          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-[#2d3130]/80 px-2 py-1 text-[11px] font-medium leading-[14px] text-[#eef1ee] backdrop-blur-md">
            <DurationIcon size={14} strokeWidth={2} />
            {post.duration}
          </span>
        </div>

        <div className="p-6 pb-2">
          <h2 className="mb-2 line-clamp-2 text-[18px] font-semibold leading-[26px] text-[#181c1b] transition-colors group-hover:text-[#006b2c]">
            {post.title}
          </h2>

          <p className="mb-4 line-clamp-2 text-[13px] font-normal leading-5 text-[#3e4a3d]">
            {post.description}
          </p>
        </div>
      </div>

      <div className="px-6 pb-6 pt-1">
        <div className="mb-2 flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${authorStyle}`}
            >
              {post.initials}
            </div>

            <div className="flex flex-col">
              <span className="text-[12px] font-semibold leading-4 text-[#181c1b]">
                {post.author}
              </span>

              <span className="text-[11px] font-medium leading-[14px] text-[#3e4a3d]">
                {post.authorRole}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-medium leading-[14px] text-[#3e4a3d]">
            {post.calories && (
              <>
                <span className="flex items-center gap-0.5">
                  <Flame size={14} strokeWidth={2} />
                  {post.calories}
                </span>

                <span>·</span>
              </>
            )}

            <span className="flex items-center gap-0.5">
              <MessageCircle size={14} strokeWidth={2} />
              {post.comments}
            </span>
          </div>
        </div>

        <div className="-mx-6 -mb-6 flex items-center justify-between bg-[#f1f4f1] px-6 py-2">
          <span className="text-[11px] font-medium leading-[14px] text-[#3e4a3d]">
            {post.date}
          </span>

          <a
            href={`/content/${post.id}`}
            className="inline-flex items-center gap-1 text-[14px] font-semibold leading-5 text-[#006b2c] transition-colors hover:text-[#00873a]"
          >
            {post.action}

            <ArrowRight
              size={18}
              strokeWidth={2}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>
        </div>
      </div>
    </article>
  );
}

function Pagination() {
  const [currentPage, setCurrentPage] = useState(1);

  const pages = [1, 2, 3];

  return (
    <div className="flex flex-col items-center justify-between gap-4 pb-12 pt-2 sm:flex-row">
      <p className="order-2 text-[13px] font-normal leading-5 text-[#3e4a3d] sm:order-1">
        Showing{" "}
        <span className="font-semibold text-[#181c1b]">
          {currentPage === 1 ? "1–6" : `${(currentPage - 1) * 6 + 1}–${currentPage * 6}`}
        </span>{" "}
        of <span className="font-semibold text-[#181c1b]">48</span> articles
      </p>

      <div className="order-1 flex items-center gap-1 sm:order-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled={currentPage === 1}
          onClick={() =>
            setCurrentPage((page) => Math.max(1, page - 1))
          }
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#181c1b] shadow-sm transition-colors hover:bg-[#ebefec] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            aria-current={currentPage === page ? "page" : undefined}
            onClick={() => setCurrentPage(page)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-[14px] font-semibold leading-5 shadow-sm transition-colors ${currentPage === page
              ? "bg-[#006b2c] text-white"
              : "bg-white text-[#181c1b] hover:bg-[#ebefec]"
              }`}
          >
            {page}
          </button>
        ))}

        <span className="px-1 text-[14px] font-semibold leading-5 text-[#6e7b6c]">
          …
        </span>

        <button
          type="button"
          onClick={() =>
            setCurrentPage((page) => Math.min(8, page + 1))
          }
          className="flex h-10 items-center justify-center gap-1 rounded-lg bg-white px-4 text-[14px] font-semibold leading-5 text-[#181c1b] shadow-sm transition-colors hover:bg-[#ebefec]"
        >
          Next
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    setSubmitted(true);
    setEmail("");
  };

  return (
    <section className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-xl bg-[#92f5a4] p-6 shadow-sm sm:p-8 md:flex-row lg:p-12">
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-[#62df7d]/30 blur-3xl" />

      <div className="relative z-10 max-w-xl text-center md:text-left">
        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[12px] font-semibold leading-4 text-[#007233] shadow-sm">
          <Mail size={16} strokeWidth={2} />
          Weekly Plant Wisdom
        </div>

        <h3 className="mb-1 text-[28px] font-bold leading-9 tracking-tight text-[#00210a] sm:text-[28px]">
          Get wholesome seasonal recipes directly in your inbox.
        </h3>

        <p className="text-[15px] font-normal leading-6 text-[#3e4a3d]">
          No spam, ever. Just dietitian-reviewed meal prep ideas, mindful
          lifestyle essays, and nutritional deep dives every Thursday.
        </p>
      </div>

      <div className="relative z-10 w-full shrink-0 md:w-auto">
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>

          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setSubmitted(false);
            }}
            placeholder="Enter your email address..."
            required
            className="h-11 min-w-0 flex-1 rounded-lg bg-white px-4 text-[15px] font-normal leading-6 text-[#181c1b] shadow-sm outline-none placeholder:text-[#6e7b6c] focus:ring-2 focus:ring-[#006b2c] sm:min-w-[240px]"
          />

          <button
            type="submit"
            className="h-11 whitespace-nowrap rounded-lg bg-[#006b2c] px-6 text-[14px] font-semibold leading-5 text-white shadow-sm transition-colors hover:bg-[#00873a]"
          >
            Subscribe Free
          </button>
        </form>

        <p className="mt-1 text-center text-[11px] font-medium leading-[14px] text-[#3e4a3d] md:text-left">
          {submitted
            ? "Thanks for subscribing!"
            : "Join 24,000+ mindful home chefs and wellness seekers."}
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="w-full border-t border-[#e0e3e0] bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-12">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <img
                src={logoUrl}
                alt="ChayBook logo"
                className="h-6 w-auto object-contain"
              />

              <span className="text-[18px] font-bold text-[#006b2c]">
                ChayBook
              </span>
            </div>

            <p className="mb-4 text-[13px] font-normal leading-5 text-[#3e4a3d]">
              Your mindful companion for whole-food, plant-based living.
              Evidence-backed nutritional guidance and empowering
              plant-centered meal tools.
            </p>

            <div className="flex items-center gap-2 text-[#3e4a3d]">
              <a
                href="#community"
                aria-label="Global Community"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ebefec] transition-colors hover:text-[#006b2c]"
              >
                <Globe size={16} />
              </a>

              <a
                href="#newsletter"
                aria-label="Newsletter"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ebefec] transition-colors hover:text-[#006b2c]"
              >
                <Mail size={16} />
              </a>

              <a
                href="#rss"
                aria-label="RSS"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ebefec] transition-colors hover:text-[#006b2c]"
              >
                <Rss size={16} />
              </a>
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="mb-2 text-[18px] font-semibold leading-[26px] text-[#181c1b]">
                {column.title}
              </h4>

              <ul className="space-y-2 text-[13px] font-normal leading-5 text-[#3e4a3d]">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href={`#${link
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")}`}
                      className="transition-colors hover:text-[#006b2c]"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#e6e9e6] pt-6 text-[11px] font-medium leading-[14px] text-[#3e4a3d] md:flex-row">
          <p className="text-center md:text-left">
            © 2024 ChayBook. Cultivating mindful wellness through plant
            nutrition.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#privacy-policy"
              className="transition-colors hover:text-[#181c1b]"
            >
              Privacy Policy
            </a>

            <a
              href="#terms-of-service"
              className="transition-colors hover:text-[#181c1b]"
            >
              Terms of Service
            </a>

            <a
              href="#editorial-standards"
              className="transition-colors hover:text-[#181c1b]"
            >
              Editorial Standards
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function ContentPage() {
  const [activeCategory, setActiveCategory] = useState("recipes");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === "all" || post.category === activeCategory;

      const matchesSearch =
        normalizedQuery.length === 0 ||
        post.title.toLowerCase().includes(normalizedQuery) ||
        post.description.toLowerCase().includes(normalizedQuery) ||
        post.categoryLabel.toLowerCase().includes(normalizedQuery) ||
        post.author.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleSearch = (event) => {
    event.preventDefault();
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] font-sans text-[#181c1b] antialiased">
      <Header />

      <main className="min-h-screen w-full bg-[#f7faf7] pt-16">
        <div className="flex w-full flex-col">
          <div className="relative mx-auto w-full max-w-[1280px] px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-12 lg:pb-16 lg:pt-8">
            <div className="pointer-events-none absolute -top-12 left-1/2 h-[240px] w-[600px] -translate-x-1/2 rounded-full bg-[#92f5a4]/20 blur-[100px]" />

            <section className="relative z-10 mb-12 flex flex-col items-center text-center sm:mb-16">
              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#92f5a4] px-3 py-1 text-[12px] font-semibold leading-4 tracking-wide text-[#007233]">
                <Leaf
                  size={16}
                  strokeWidth={2}
                  fill="currentColor"
                />
                Curated Plant-Based Living
              </span>

              <h1 className="mb-2 max-w-2xl text-[28px] font-bold leading-9 tracking-tight text-[#181c1b] sm:text-[36px] sm:leading-[44px]">
                Explore Our Posts
              </h1>

              <p className="mb-8 max-w-xl text-[16px] font-normal leading-7 tracking-[-0.005em] text-[#3e4a3d] sm:text-[18px]">
                Discover healthy recipes, nutrition tips, and inspiration for
                a better vegetarian lifestyle.
              </p>

              <form
                onSubmit={handleSearch}
                className="mb-6 flex w-full max-w-2xl items-center gap-2 rounded-xl bg-white p-1 shadow-sm transition-shadow duration-200 focus-within:shadow-md"
              >
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
                  onChange={(event) => setSearchQuery(event.target.value)}
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
            </section>

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
              <section className="mb-12 flex min-h-[300px] flex-col items-center justify-center rounded-xl bg-white p-8 text-center shadow-sm">
                <Search
                  size={40}
                  className="mb-4 text-[#6e7b6c]"
                  strokeWidth={1.5}
                />

                <h2 className="mb-2 text-[22px] font-semibold leading-[30px] text-[#181c1b]">
                  No posts found
                </h2>

                <p className="max-w-md text-[15px] leading-6 text-[#3e4a3d]">
                  Try another search keyword or select a different category.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="mt-5 rounded-lg bg-[#006b2c] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00873a]"
                >
                  Clear filters
                </button>
              </section>
            )}

            <Pagination />

            <NewsletterBanner />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}