import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Calculator,
  CheckCircle,
  Dumbbell,
  MessageCircle,
  Send,
  Sparkles,
  Star,
  Users,
  Utensils,
} from "lucide-react";

import Input from "../components/common/Input";
import Button from "../components/common/Button";
import BmiCalculator from "../components/bmi/BmiCalculator";

import { getArticles } from "../services/articleServices";
import { sendAIMessage } from "../services/aiAssistantService";
import { resolveMediaUrl } from "../services/app";
import useAdminResource from "../hooks/useAdminResource";
import { useCategoryOptions } from "../hooks/useCategoryOptions";

/* =========================================================
   FEATURED CONTENT
========================================================= */

function FeaturedCard({ post }) {
  return <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
    <Link to={`/content/${post.id}`}>
      {post.image && <img src={post.image} alt={post.title} className="h-56 w-full object-cover" />}
      <div className="space-y-2 p-6"><h3 className="text-lg font-bold">{post.title}</h3><p className="line-clamp-3 text-sm text-gray-600">{post.description}</p></div>
    </Link>
  </article>;
}

function AiQuickAssistant() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState(null);

  const handleAskAi = async (e) => {
    e.preventDefault();

    const value = prompt.trim();

    if (!value || busy) return;
    setBusy(true); setError(""); setResponse("");
    try {
      const reply = await sendAIMessage(value, conversationId);
      setResponse(reply.content); setConversationId(reply.conversationId);
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }

  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-chaybook-primary">
        <Sparkles className="h-[18px] w-[18px]" />
        <span>Gợi ý bữa ăn nhanh</span>
      </div>

      <h3 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
        Bạn cần gợi ý bữa tối lành mạnh ngay lúc này?
      </h3>

      <p className="text-sm leading-6 text-gray-600 md:text-base">
        Nhập nguyên liệu bạn có hoặc mục tiêu dinh dưỡng. AI sẽ gợi ý những món
        ăn từ thực vật phù hợp với nhu cầu của bạn.
      </p>

      <form
        onSubmit={handleAskAi}
        className="relative mt-1 flex w-full items-center"
      >
        <Input
          label="Hỏi AI về dinh dưỡng"
          type="text" required maxLength={4000} disabled={busy}
          placeholder="Ví dụ: đậu phụ, bông cải và gạo lứt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="h-13 pr-28"
        />

        <button
          type="submit" disabled={busy}
          className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-1 rounded-lg bg-chaybook-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-chaybook-hover"
        >
          {busy ? "Đang hỏi…" : "Hỏi AI"}
          <Send className="h-4 w-4" />
        </button>
      </form>

      {error && <p role="alert" className="text-red-700">{error}</p>}
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

// Displays the ChayBook home page and featured content.
function HomePage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const { categories } = useCategoryOptions("ARTICLE");
  const load = useCallback((signal) => getArticles(activeCategory === "all" ? null : Number(activeCategory), 0, 3, "PUBLISHED", { signal }), [activeCategory]);
  const resource = useAdminResource(load);
  const posts = (resource.data?.content || []).map((article) => ({ id: article.articleId, title: article.title, description: article.content, image: resolveMediaUrl(article.coverImage) }));
  const featuredPosts = posts;
  const featuredCategories = [{ id: "all", label: "All" }, ...categories.map((c) => ({ id: String(c.categoryId), label: c.name }))];

  return (
    <div className="min-h-screen bg-chaybook-bg font-sans text-gray-900 antialiased">
      <main className="w-full">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative isolate overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/home-background.png')" }}
          />

          <div className="relative z-10 mx-auto max-w-[1240px] px-4 pb-20 pt-12 sm:px-6 lg:px-12 lg:pb-24 lg:pt-20">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
              {/* LEFT */}
              <div className="flex flex-col items-start gap-6 lg:col-span-7">
                {/* Trust */}
                <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-chaybook-container px-3.5 py-1.5 shadow-sm">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-chaybook-primary">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-chaybook-primary" />
                    Hơn 25.000 công thức và cẩm nang đã kiểm duyệt
                  </span>

                  <span className="h-1 w-1 rounded-full bg-gray-400" />

                  <span className="flex items-center gap-1 text-xs text-gray-600">
                    <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                    <span className="font-bold text-gray-900">4.9/5</span>
                    từ hơn 12.000 người ăn thực vật
                  </span>
                </div>

                {/* Heading */}
                <div className="flex flex-col gap-2">
                  <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-[48px]">
                    Ăn ngon hơn.
                    <br />
                    <span className="text-chaybook-primary">
                      Sống khỏe hơn.
                    </span>
                  </h1>

                  <p className="max-w-xl pt-2 text-base leading-7 text-gray-600 md:text-lg">
                    Trợ lý thông minh và cộng đồng đồng hành đáng tin cậy giúp
                    bạn xây dựng lối sống ăn chay giàu dinh dưỡng, bền vững.
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
                      Trò chuyện với chuyên gia dinh dưỡng AI
                    </Button>
                  </Link>

                  <Link to="#featured-recipes">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex h-12 w-full items-center justify-center gap-2 px-6 sm:w-auto"
                    >
                      <Utensils className="h-5 w-5" />
                      Khám phá công thức lành mạnh
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
                      Thuần thực vật
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-2xl font-bold tracking-tight">
                      28g+
                    </span>

                    <span className="text-[11px] uppercase tracking-wider text-gray-500">
                      Protein trung bình mỗi phần
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-2xl font-bold tracking-tight">
                      0 min
                    </span>

                    <span className="text-[11px] uppercase tracking-wider text-gray-500">
                      Tư vấn AI tức thì
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT IMAGE */}
              <div className="relative mt-4 lg:col-span-5 lg:mt-0">
                <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-xl">
                  <div className="relative h-[420px] overflow-hidden rounded-xl sm:h-[460px]">
                    <img
                      src={posts[0]?.image || "/home-background.png"}
                      alt={posts[0]?.imageAlt || "Bữa ăn chay lành mạnh"}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    {/* Dish label */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-chaybook-primary" />

                      <span className="text-xs font-semibold text-gray-900">
                        {posts[0]?.title || "Tô món chay lành mạnh"}
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
                      Gợi ý dinh dưỡng từ AI
                    </span>
                  </div>

                  <p className="text-[11px] leading-snug text-gray-600">
                    Giàu protein thực vật, sắt và chất xơ prebiotic.
                  </p>
                </div>

                {/* BMI Widget */}
                <div className="absolute -bottom-6 -right-2 min-w-[210px] rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur-md sm:-right-6">
                  <div className="flex items-center justify-between gap-3 pb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Phân tích BMI
                    </span>

                    <span className="rounded-full bg-chaybook-secondary-container px-2 py-0.5 text-[11px] font-bold text-chaybook-primary">
                      Tối ưu
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      21.4
                    </span>

                    <span className="text-[11px] text-gray-500">
                      Khoảng cân nặng khỏe mạnh
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
                Công cụ hữu ích
              </span>

              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Mọi điều bạn cần để sống khỏe
              </h2>

              <p className="pt-2 text-sm leading-6 text-gray-600 md:text-base">
                Hướng dẫn ăn chay cá nhân hóa, công cụ dinh dưỡng và cộng đồng
                những người yêu nấu ăn tại nhà.
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
                      Trợ lý dinh dưỡng AI
                    </h3>

                    <p className="pt-2 text-sm leading-6 text-gray-600">
                      Hỏi về protein thực vật, vi chất, cách kết hợp món ăn và
                      dinh dưỡng chay.
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-b-2xl bg-white/60 p-5 -mx-6 -mb-6">
                  <div className="mb-4 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-chaybook-container px-3 py-1.5 text-xs text-gray-600">
                    <MessageCircle className="h-3.5 w-3.5 text-chaybook-primary" />

                    <span className="truncate">
                      "Bữa tối giàu protein trong 15 phút?"
                    </span>
                  </div>

                  <Link
                    to="/ai-assistant"
                    className="flex items-center justify-between text-sm font-semibold text-chaybook-primary"
                  >
                    Trải nghiệm AI dinh dưỡng
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
                      Phân tích BMI & sức khỏe
                    </h3>

                    <p className="pt-2 text-sm leading-6 text-gray-600">
                      Tính BMI, tìm hiểu các chỉ số sức khỏe và nhận hướng dẫn
                      dinh dưỡng chay phù hợp.
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-b-2xl bg-white/60 p-5 -mx-6 -mb-6">
                  <div className="mb-4 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-chaybook-container px-3 py-1.5 text-xs text-gray-600">
                    <Calculator className="h-3.5 w-3.5 text-chaybook-primary" />

                    <span className="truncate">
                      Theo dõi cân nặng và chuyển hóa
                    </span>
                  </div>

                  <Link
                    to="/bmi"
                    className="flex items-center justify-between text-sm font-semibold text-chaybook-primary"
                  >
                    Tính ngay
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
                      Cộng đồng ăn chay
                    </h3>

                    <p className="pt-2 text-sm leading-6 text-gray-600">
                      Kết nối với những người yêu món chay, chia sẻ bữa ăn, khám
                      phá địa điểm ăn uống và trao đổi bí quyết sống khỏe.
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-b-2xl bg-white/60 p-5 -mx-6 -mb-6">
                  <div className="mb-4 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-chaybook-container px-3 py-1.5 text-xs text-gray-600">
                    <MessageCircle className="h-3.5 w-3.5 text-chaybook-primary" />

                    <span className="truncate">
                      Hơn 1.400 cuộc trò chuyện hôm nay
                    </span>
                  </div>

                  <Link
                    to="/community"
                    className="flex items-center justify-between text-sm font-semibold text-chaybook-primary"
                  >
                    Khám phá cộng đồng
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
                  Featured Articles
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
            {resource.loading ? <p role="status">Loading featured articles?</p> : resource.error ? <div role="alert">{resource.error}<button type="button" onClick={resource.retry}>Retry</button></div> : featuredPosts.length > 0 ? (
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
                  View All Articles
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
              <BmiCalculator />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
