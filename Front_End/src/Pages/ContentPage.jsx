import { useMemo, useState } from "react";
import { Leaf, Search } from "lucide-react";

import Input from "../components/common/Input";
import Button from "../components/common/Button";

// Mock data - dùng tạm khi Backend chưa có API
const posts = [
  {
    id: 1,
    category: "recipes",
    categoryLabel: "Recipes",
    title:
      "Avocado Quinoa Salad – A healthy, easy-to-make vegetarian meal at home",
    description:
      "A colorful, nutrient-packed bowl full of fresh vegetables, quinoa and a zesty tahini dressing. Perfect for lunch!",
    author: "Sarah Green",
    authorRole: "Dietitian",
    calories: "495 kcal",
    comments: 24,
    date: "Apr 12, 2024",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1UmS85DWMio266GaCmBtoF5p2SbdcO-D7YXEYhjqB2bMqDjA8eeyu8SBYPi3YX9xW_DldcWAqyznz_bKUv7B1lrtk9CGVucoF_hES-abjw8Vwjt76bdkvM_MasS8akxPrNQTBGjsc0M-fF21QL0AI-MkdCTq5dZWs57F2BthWk3iFciw5sVVacB_bF8zBu2TNtClZ4oDcmbTq9JASYh-Ssi6LQFOKZQBh0LBLToo_LDPPUfeMl7fVASIw",
  },
  {
    id: 2,
    category: "recipes",
    categoryLabel: "Recipes",
    title: "Fresh Homemade Avocado Sourdough with Microgreens",
    description:
      "Loaded with monounsaturated healthy fats, crunchy radish, and living microgreen enzymes for vital mornings.",
    author: "Sarah Green",
    authorRole: "Dietitian",
    calories: "320 kcal",
    comments: 18,
    date: "Apr 10, 2024",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1VdoBwdTrLghRZZ_PtVBBlZ89DAvHTxETbhzjwbR3Ztnxx9IsbpW1-HWpGK6kQFqIzAVK0lr9gT1UbLdIQDtnjNsIVAyALcNWMopB_RFFYcR44Ze06IDeZ9QvplZy5O8iJOSZ6TFQKXTtAvf8QpVrBAOirrER8hUAwPt12b2gMcbBfe4sLtxn-ZJUacgil9zs1vbEzwfSf7DZhZ1xp2JtJROSUxvg8gjmWmqaNeqGVZGICrS--aSkdKUlo",
  },
  {
    id: 3,
    category: "nutrition",
    categoryLabel: "Nutrition",
    title: "Creamy Roasted Pumpkin Ginger Soup with Pepitas",
    description:
      "Warm anti-inflammatory comfort bowl slow-simmered with coconut milk, turmeric, and toasted pumpkin seeds.",
    author: "Dr. Elena Rostova",
    authorRole: "Nutritionist",
    calories: "210 kcal",
    comments: 32,
    date: "Apr 08, 2024",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1V0eAO_LvyrGJcFiQB34FJw4nozoRO_veC_LMZNMCoM-hsyU8LQFcPaqbMRHvjXXQ7nrROnEbcWe2bNjYXms1Axu-WXuIyYcWZYzgaupKO7-pRICvxaUG2l8IuLTk7JgwPqfYpVN9cCo1Ud6mb6j5A-YGzx3QGICOrpO2tZx5bcOiNBaOJ7t28eiWzbLsigjDh1CvTEmNJiZE-aWG-xqrhwFfLg6eIngtfZPcvMo6xEwZeqUzxRdhQUW1M",
  },
  {
    id: 4,
    category: "recipes",
    categoryLabel: "Recipes",
    title: "Crisp Summer Spring Rolls with Zesty Peanut Dip",
    description:
      "Refreshing rice paper rolls packed with crisp cucumber, mint, carrots, and vermicelli with rich peanut dip.",
    author: "Tien Nguyen",
    authorRole: "Culinary Lead",
    calories: "280 kcal",
    comments: 14,
    date: "Apr 05, 2024",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCZSGiIGGjN8CjLlk3LP3FeMMMXQGAaj0xartwNFiRVf_vU6A6BeIQXIpRQsI-W5Ljc2K_-3lh-KLZwXpN-ADBFkJkCGxVMGaKZoPJk_j1qTwx7_9CO-kVOltKdBms-8I_RuRM4WBPNp8Ck999j2-zM4OrI2IQN8WVmfsqpkz7EEbkzSakqe9j8oti5YpYm89VkX2lxNbhSOP5TX5EOyyaWjetfblNC7DEzGNA36Dhk3dEOHGoHmb3s",
  },
  {
    id: 5,
    category: "lifestyle",
    categoryLabel: "Lifestyle",
    title: "Mediterranean Herb Garden Salad with Kalamata Olives",
    description:
      "Sun-ripened organic tomatoes, crisp Persian cucumbers, oregano-infused cold-pressed olive oil, and plant feta.",
    author: "Marcus Vance",
    authorRole: "Holistic Coach",
    calories: "240 kcal",
    comments: 19,
    date: "Apr 03, 2024",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCLEIrN9wQ2uGj1OP6aezuzV2YQn0RpoIk-aNBblA5CqQZBkB9jtCwePqWayvgl1q_xOdv4VTEoo96Lq9hMm_CdMkU7tFQF0nN8k2wONk3rbXSveCzaeBtfJYU7U9WgtOg_xiTwZmynCHXDQx3-hhbn_lQdv_2TdolhwJWZd75IVllKaJALTVlBK4Hj84OBjB0fEIVE-M6LAglc8JYjDihwVTpP6xETydFW8iUq7x24WpLzKmpNcpxg",
  },
  {
    id: 6,
    category: "tips",
    categoryLabel: "Tips",
    title: "The Complete Guide to High-Protein Vegetarian Meal Prepping",
    description:
      "How to batch-cook balanced macro grain bowls with diverse plant proteins to save time during busy workweeks.",
    author: "Sarah Green",
    authorRole: "Dietitian",
    calories: null,
    comments: 42,
    date: "Mar 28, 2024",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1VTLHEzsp0n2ra6xBNduvIDDgPZ76VrN-cr43gmM8kp8WasUNdFB-ioeyQszojmDC3t3xmS8H_BPMJUgnGCSbFyQJYNkzp3Pi-XR4DFMK_douWI32E9NlOek1DxwgtYTS6jrkVW43i3xgZttabm-s1HHss0UFlU5N-_DVmV1c3m0TL_6NtuFtf3WEWob4cIZzzzPWbA2m_kOZhu4NBcsYns5MN8d4xk_SL5g0SW0Ok5LJxThdMaE7Gba90",
  },
];

const categories = [
  { id: "all", label: "All" },
  { id: "recipes", label: "Recipes" },
  { id: "nutrition", label: "Nutrition" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "tips", label: "Tips" },
];

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
          >
            {category.label}
          </Button>
        );
      })}
    </div>
  );
}

function PostCard({ post }) {
  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg">
      <img
        src={post.image}
        alt={post.title}
        className="h-52 w-full object-cover"
      />

      <div className="p-5">
        <span className="text-sm font-semibold text-chaybook-primary">
          {post.categoryLabel}
        </span>

        <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-gray-800">
          {post.title}
        </h2>

        <p className="mt-2 line-clamp-2 text-sm text-gray-600">
          {post.description}
        </p>

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>{post.author}</span>
          <span>{post.comments} comments</span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">{post.date}</span>

          <a
            href={`/content/${post.id}`}
            className="text-sm font-semibold text-chaybook-primary hover:underline"
          >
            Read More →
          </a>
        </div>
      </div>
    </article>
  );
}

function Pagination() {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="mt-10 flex justify-center gap-2">
      {[1, 2, 3].map((page) => (
        <Button
          key={page}
          size="sm"
          variant={currentPage === page ? "primary" : "outline"}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Button>
      ))}
    </div>
  );
}

export default function ContentPage() {
  const [activeCategory, setActiveCategory] = useState("recipes");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === "all" || post.category === activeCategory;

      const matchesSearch =
        query.length === 0 ||
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query) ||
        post.categoryLabel.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-chaybook-bg">
      <main className="pt-8">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Page heading */}
          <section className="mb-10 text-center">
            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-chaybook-primary">
              <Leaf size={16} />
              Curated Plant-Based Living
            </div>

            <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
              Explore Our Posts
            </h1>

            <p className="mx-auto mt-2 max-w-xl text-gray-600">
              Discover healthy recipes, nutrition tips, and inspiration for a
              better vegetarian lifestyle.
            </p>
          </section>

          {/* Search */}
          <div className="mx-auto mb-6 flex max-w-2xl gap-2">
            <Input
              icon={Search}
              type="search"
              placeholder="Search posts, recipes, tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Button type="button" size="md">
              Search
            </Button>
          </div>

          {/* Category */}
          <div className="mb-10">
            <CategoryFilter
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>

          {/* Posts */}
          {filteredPosts.length > 0 ? (
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </section>
          ) : (
            <section className="rounded-xl bg-white p-12 text-center shadow-sm">
              <Search size={40} className="mx-auto mb-4 text-gray-400" />

              <h2 className="text-xl font-semibold text-gray-800">
                No posts found
              </h2>

              <p className="mt-2 text-gray-600">
                Try another search keyword or select a different category.
              </p>

              <Button
                className="mt-5"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
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
