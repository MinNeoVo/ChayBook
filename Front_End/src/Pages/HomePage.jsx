import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Bot,
  Calculator,
  CheckCircle,
  ChevronRight,
  Clock3,
  Dumbbell,
  Heart,
  MessageCircle,
  Send,
  Sparkles,
  Star,
  Users,
  Utensils,
} from "lucide-react";

import Input from "../components/common/Input";
import Button from "../components/common/Button";

import { posts } from "../data/contentData";

/* =========================================================
   FEATURED CONTENT
========================================================= */

const featuredCategories = [
  { id: "all", label: "All" },
  { id: "recipes", label: "Recipes" },
  { id: "nutrition", label: "Nutrition" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "tips", label: "Tips" },
];

/* =========================================================
   FEATURED CARD
========================================================= */

function FeaturedCard({ post }) {
  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div>
        {/* Image */}
        <div className="relative h-56 w-full overflow-hidden bg-chaybook-container">
          <img
            src={post.image}
            alt={post.imageAlt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Category + duration */}
          <div className="absolute left-3.5 top-3.5 flex items-center gap-1.5">
            <span className="rounded-md bg-white/90 px-2.5 py-1 text-xs font-bold text-chaybook-primary shadow-sm backdrop-blur-md">
              {post.categoryLabel}
            </span>

            {post.duration && (
              <span className="flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-gray-800 shadow-sm backdrop-blur-md">
                <Clock3 className="h-3.5 w-3.5 text-gray-500" />
                {post.duration}
              </span>
            )}
          </div>

          {/* Bookmark */}
          <button
            type="button"
            aria-label="Bookmark"
            className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm backdrop-blur-md transition-colors hover:text-chaybook-primary"
          >
            <Bookmark className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-6">
          <h3 className="line-clamp-2 text-lg font-bold leading-7 text-gray-900 transition-colors group-hover:text-chaybook-primary">
            {post.title}
          </h3>

          <p className="line-clamp-2 text-sm leading-6 text-gray-600">
            {post.description}
          </p>
        </div>
      </div>

      {/* Author */}
      <div className="mt-2 flex items-center justify-between border-t border-gray-200/70 px-6 pb-6 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-chaybook-secondary-container text-xs font-bold text-chaybook-primary">
            {post.initials}
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-900">
              {post.author}
            </span>

            <span className="text-[11px] text-gray-500">{post.authorRole}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {post.calories && (
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {post.calories}
            </span>
          )}

          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.comments}
          </span>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   BMI CALCULATOR
========================================================= */

function QuickBmiCalculator() {
  const [height, setHeight] = useState(172);
  const [weight, setWeight] = useState(65);

  const [bmi, setBmi] = useState(22);
  const [status, setStatus] = useState("Normal Weight");

  const calculateBmi = () => {
    const heightValue = Number(height);
    const weightValue = Number(weight);

    if (!heightValue || !weightValue) {
      return;
    }

    if (heightValue <= 0 || weightValue <= 0) {
      return;
    }

    const heightInMeter = heightValue / 100;

    const result = weightValue / (heightInMeter * heightInMeter);

    const roundedBmi = Number(result.toFixed(1));

    setBmi(roundedBmi);

    if (roundedBmi < 18.5) {
      setStatus("Underweight");
    } else if (roundedBmi < 25) {
      setStatus("Normal Weight");
    } else if (roundedBmi < 30) {
      setStatus("Overweight");
    } else {
      setStatus("Obese Range");
    }
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-md md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chaybook-secondary-container text-chaybook-primary">
            <Dumbbell className="h-5 w-5" />
          </div>

          <h4 className="text-lg font-bold text-gray-900">
            Quick BMI Calculator
          </h4>
        </div>

        <span className="text-xs text-gray-500">WHO Standard</span>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Height (cm)"
          type="number"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          min="100"
          max="240"
        />

        <Input
          label="Weight (kg)"
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          min="30"
          max="250"
        />
      </div>

      {/* Calculate */}
      <Button
        type="button"
        onClick={calculateBmi}
        className="flex h-11 items-center justify-center gap-2"
      >
        <Calculator className="h-[18px] w-[18px]" />
        Calculate Health Status
      </Button>

      {/* Result */}
      <div className="flex items-center justify-between rounded-xl bg-chaybook-container p-4">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Your BMI Result</span>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-chaybook-primary">
              {bmi}
            </span>

            <span className="text-sm font-semibold text-chaybook-primary">
              {status}
            </span>
          </div>
        </div>

        <Link
          to="/bmi"
          className="flex items-center gap-1 text-xs font-semibold text-chaybook-primary hover:underline"
        >
          Full Analysis
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* =========================================================
   AI QUICK ASSISTANT
========================================================= */

function AiQuickAssistant() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");

  const handleAskAi = (e) => {
    e.preventDefault();

    const value = prompt.trim();

    if (!value) {
      setResponse("Try entering ingredients or a dietary goal.");
      return;
    }

    setResponse(
      `Based on "${value}", try pan-seared ginger tofu with steamed broccoli over brown rice.`,
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-chaybook-primary">
        <Sparkles className="h-[18px] w-[18px]" />
        <span>Immediate Meal Inspiration</span>
      </div>

      <h3 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
        Need an immediate healthy dinner idea?
      </h3>

      <p className="text-sm leading-6 text-gray-600 md:text-base">
        Type your available ingredients or dietary goals. Our AI can suggest
        plant-based meal combinations based on your needs.
      </p>

      <form
        onSubmit={handleAskAi}
        className="relative mt-1 flex w-full items-center"
      >
        <Input
          type="text"
          placeholder="e.g. Tofu, broccoli and brown rice..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="h-13 pr-28"
        />

        <button
          type="submit"
          className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-1 rounded-lg bg-chaybook-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-chaybook-hover"
        >
          Ask AI
          <Send className="h-4 w-4" />
        </button>
      </form>

      {response && (
        <div className="flex items-start gap-2.5 rounded-xl bg-white p-4 text-sm shadow-sm">
          <CheckCircle className="h-5 w-5 shrink-0 text-chaybook-primary" />

          <p className="leading-5 text-gray-600">{response}</p>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   HOME PAGE
========================================================= */

function HomePage() {
  const [activeCategory, setActiveCategory] = useState("all");

  /*
   * Lấy data trực tiếp từ contentData.js
   * nên HomePage và ContentPage dùng chung dữ liệu.
   */
  const featuredPosts = useMemo(() => {
    const filtered =
      activeCategory === "all"
        ? posts
        : posts.filter((post) => post.category === activeCategory);

    return filtered.slice(0, 3);
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-chaybook-bg font-sans text-gray-900 antialiased">
      <main className="w-full">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative overflow-hidden">
          {/* Background glow */}
          <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[350px] w-[900px] -translate-x-1/2 rounded-full bg-chaybook-secondary-container/30 blur-[110px]" />

          <div className="mx-auto max-w-[1240px] px-4 pb-20 pt-12 sm:px-6 lg:px-12 lg:pb-24 lg:pt-20">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
              {/* LEFT */}
              <div className="flex flex-col items-start gap-6 lg:col-span-7">
                {/* Trust */}
                <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-chaybook-container px-3.5 py-1.5 shadow-sm">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-chaybook-primary">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-chaybook-primary" />
                    25,000+ recipes & verified guides
                  </span>

                  <span className="h-1 w-1 rounded-full bg-gray-400" />

                  <span className="flex items-center gap-1 text-xs text-gray-600">
                    <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                    <span className="font-bold text-gray-900">4.9/5</span>
                    by 12,000+ plant eaters
                  </span>
                </div>

                {/* Heading */}
                <div className="flex flex-col gap-2">
                  <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-[48px]">
                    Eat Better.
                    <br />
                    <span className="text-chaybook-primary">
                      Live Healthier.
                    </span>
                  </h1>

                  <p className="max-w-xl pt-2 text-base leading-7 text-gray-600 md:text-lg">
                    Your personal intelligent assistant and trusted peer
                    community for a vibrant, nutrient-dense, and sustainable
                    vegetarian lifestyle.
                  </p>
                </div>

                {/* CTA */}
                <div className="flex w-full flex-col gap-3 pt-1 sm:w-auto sm:flex-row">
                  <Link to="/ai-assistant">
                    <Button
                      type="button"
                      className="flex h-12 w-full items-center justify-center gap-2 px-6 sm:w-auto"
                    >
                      <Bot className="h-5 w-5" />
                      Chat with AI Nutritionist
                    </Button>
                  </Link>

                  <Link to="#featured-recipes">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex h-12 w-full items-center justify-center gap-2 px-6 sm:w-auto"
                    >
                      <Utensils className="h-5 w-5" />
                      Explore Healthy Recipes
                    </Button>
                  </Link>
                </div>

                {/* Metrics */}
                <div className="grid w-full max-w-lg grid-cols-3 gap-4 pt-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold tracking-tight">
                      100%
                    </span>

                    <span className="text-[11px] uppercase tracking-wider text-gray-500">
                      Plant-Based
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-2xl font-bold tracking-tight">
                      28g+
                    </span>

                    <span className="text-[11px] uppercase tracking-wider text-gray-500">
                      Avg Bowl Protein
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-2xl font-bold tracking-tight">
                      0 min
                    </span>

                    <span className="text-[11px] uppercase tracking-wider text-gray-500">
                      Instant AI Advice
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT IMAGE */}
              <div className="relative mt-4 lg:col-span-5 lg:mt-0">
                <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-xl">
                  <div className="relative h-[420px] overflow-hidden rounded-xl sm:h-[460px]">
                    <img
                      src={posts[0]?.image}
                      alt={posts[0]?.imageAlt || "Healthy vegetarian meal"}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    {/* Dish label */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-chaybook-primary" />

                      <span className="text-xs font-semibold text-gray-900">
                        {posts[0]?.title || "Healthy Vegetarian Bowl"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Widget */}
                <div className="absolute -left-4 -top-4 max-w-[240px] rounded-xl bg-white/95 p-3.5 shadow-lg backdrop-blur-md sm:-left-8">
                  <div className="flex items-center gap-2 pb-1.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-chaybook-secondary-container text-chaybook-primary">
                      <CheckCircle className="h-4 w-4" />
                    </div>

                    <span className="text-xs font-bold">
                      AI Nutrition Insight
                    </span>
                  </div>

                  <p className="text-[11px] leading-snug text-gray-600">
                    High in plant protein, rich in iron and prebiotic fiber.
                  </p>
                </div>

                {/* BMI Widget */}
                <div className="absolute -bottom-6 -right-2 min-w-[210px] rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur-md sm:-right-6">
                  <div className="flex items-center justify-between gap-3 pb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      BMI Analysis
                    </span>

                    <span className="rounded-full bg-chaybook-secondary-container px-2 py-0.5 text-[11px] font-bold text-chaybook-primary">
                      Optimal
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      21.4
                    </span>

                    <span className="text-[11px] text-gray-500">
                      Healthy weight range
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full w-[45%] rounded-full bg-chaybook-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            TOOLS
        ================================================= */}

        <section className="w-full bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-12">
            {/* Header */}
            <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center text-center">
              <span className="mb-3 rounded-full bg-chaybook-secondary-container px-3 py-1 text-xs font-bold uppercase tracking-wider text-chaybook-primary">
                Powerful Tools
              </span>

              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Everything You Need to Flourish
              </h2>

              <p className="pt-2 text-sm leading-6 text-gray-600 md:text-base">
                Personalized vegetarian guidance, nutritional tools, and a
                vibrant community of passionate home cooks.
              </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* AI */}
              <div className="group flex flex-col justify-between rounded-2xl bg-chaybook-container p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex flex-col gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chaybook-secondary-container text-chaybook-primary transition-transform group-hover:scale-110">
                    <Bot className="h-[26px] w-[26px]" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      AI Nutrition Assistant
                    </h3>

                    <p className="pt-2 text-sm leading-6 text-gray-600">
                      Ask questions about plant proteins, micronutrients, meal
                      pairings and vegetarian nutrition.
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-b-2xl bg-white/60 p-5 -mx-6 -mb-6">
                  <div className="mb-4 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-chaybook-container px-3 py-1.5 text-xs text-gray-600">
                    <MessageCircle className="h-3.5 w-3.5 text-chaybook-primary" />

                    <span className="truncate">
                      "Quick 15-min high-protein dinner?"
                    </span>
                  </div>

                  <Link
                    to="/ai-assistant"
                    className="flex items-center justify-between text-sm font-semibold text-chaybook-primary"
                  >
                    Try Nutrition AI
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </Link>
                </div>
              </div>

              {/* BMI */}
              <div className="group flex flex-col justify-between rounded-2xl bg-chaybook-container p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex flex-col gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chaybook-secondary-container text-chaybook-primary transition-transform group-hover:scale-110">
                    <Dumbbell className="h-[26px] w-[26px]" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      BMI & Health Analysis
                    </h3>

                    <p className="pt-2 text-sm leading-6 text-gray-600">
                      Calculate your BMI, understand your health metrics and
                      receive tailored vegetarian guidance.
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-b-2xl bg-white/60 p-5 -mx-6 -mb-6">
                  <div className="mb-4 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-chaybook-container px-3 py-1.5 text-xs text-gray-600">
                    <Calculator className="h-3.5 w-3.5 text-chaybook-primary" />

                    <span className="truncate">
                      Visual weight & metabolic health ranges
                    </span>
                  </div>

                  <Link
                    to="/bmi"
                    className="flex items-center justify-between text-sm font-semibold text-chaybook-primary"
                  >
                    Calculate Now
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </Link>
                </div>
              </div>

              {/* Community */}
              <div className="group flex flex-col justify-between rounded-2xl bg-chaybook-container p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex flex-col gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chaybook-secondary-container text-chaybook-primary transition-transform group-hover:scale-110">
                    <Users className="h-[26px] w-[26px]" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Vegetarian Community
                    </h3>

                    <p className="pt-2 text-sm leading-6 text-gray-600">
                      Connect with plant-based foodies, share meals, discover
                      dining spots and swap healthy lifestyle tips.
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-b-2xl bg-white/60 p-5 -mx-6 -mb-6">
                  <div className="mb-4 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-chaybook-container px-3 py-1.5 text-xs text-gray-600">
                    <MessageCircle className="h-3.5 w-3.5 text-chaybook-primary" />

                    <span className="truncate">
                      1,400+ active conversations today
                    </span>
                  </div>

                  <Link
                    to="/community"
                    className="flex items-center justify-between text-sm font-semibold text-chaybook-primary"
                  >
                    Explore Community
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            FEATURED CONTENT
        ================================================= */}

        <section id="featured-recipes" className="w-full py-20 lg:py-24">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-12">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <span className="text-xs font-bold uppercase tracking-widest text-chaybook-primary">
                  Curated Kitchen
                </span>

                <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                  Featured Content & Recipes
                </h2>

                <p className="pt-2 text-sm leading-6 text-gray-600">
                  Discover healthy recipes, nutrition guides, and vegetarian
                  lifestyle inspiration.
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {featuredCategories.map((category) => {
                  const isActive = activeCategory === category.id;

                  return (
                    <Button
                      key={category.id}
                      type="button"
                      size="sm"
                      variant={isActive ? "primary" : "outline"}
                      onClick={() => setActiveCategory(category.id)}
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
            </div>

            {/* Cards */}
            {featuredPosts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {featuredPosts.map((post) => (
                  <FeaturedCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
                <p className="text-gray-500">
                  No content found in this category.
                </p>
              </div>
            )}

            {/* View all */}
            <div className="mt-10 flex justify-center">
              <Link to="/content">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex h-12 items-center gap-2 px-8"
                >
                  View All Recipes & Articles
                  <ArrowRight className="h-[18px] w-[18px]" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* =================================================
            AI + BMI SECTION
        ================================================= */}

        <section className="mx-auto w-full max-w-[1240px] px-4 pb-20 sm:px-6 lg:px-12 lg:pb-24">
          <div className="rounded-3xl bg-chaybook-container p-6 shadow-sm md:p-10">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              {/* AI */}
              <AiQuickAssistant />

              {/* BMI */}
              <QuickBmiCalculator />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
