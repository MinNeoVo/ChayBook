import { ChevronDown, Plus, Search, SlidersHorizontal } from "lucide-react";

import Button from "../common/Button";
import Input from "../common/Input";

function CommunityToolbar({
  searchQuery,
  setSearchQuery,
  category,
  setCategory,
  categories,
  categoryLoading,
  categoryError,
  sort,
  setSort,
  onCreatePost,
}) {
  return (
    <section
      className="
                flex
                flex-col
                items-stretch
                justify-between
                gap-4
                rounded-xl
                bg-white
                p-4
                shadow-sm
                lg:flex-row
                lg:items-center
            "
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="md"
          onClick={onCreatePost}
          className="whitespace-nowrap"
        >
          <span className="flex items-center gap-2">
            <Plus size={20} />
            New Post
          </span>
        </Button>

        <div className="hidden h-8 w-px bg-gray-200 sm:block" />
      </div>

      {/* Right */}
      <div
        className="
                    flex
                    flex-wrap
                    items-center
                    gap-3
                    lg:max-w-2xl
                    lg:flex-1
                    lg:justify-end
                "
      >
        <div className="min-w-[200px] flex-1">
          <Input
            icon={Search}
            placeholder="Search posts, recipes, ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
                            h-10
                            border-transparent
                            bg-[#f1f4f1]
                        "
          />
        </div>

        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={categoryLoading}
            className="
    h-10
    appearance-none
    rounded-lg
    bg-[#f1f4f1]
    py-2
    pl-3
    pr-9
    text-xs
    font-semibold
    text-gray-700
    outline-none
  "
          >
            <option value="all">All Posts</option>

            {categories.map((item) => (
              <option key={item.categoryId} value={item.categoryId}>
                {item.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="
                            pointer-events-none
                            absolute
                            right-2
                            top-1/2
                            -translate-y-1/2
                            text-gray-400
                        "
          />
        </div>
        {categoryError && (
          <p className="text-xs text-red-500">{categoryError}</p>
        )}

        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="
                            h-10
                            appearance-none
                            rounded-lg
                            bg-[#f1f4f1]
                            py-2
                            pl-3
                            pr-9
                            text-xs
                            font-semibold
                            text-gray-700
                            outline-none
                        "
          >
            <option value="latest">Latest</option>

            <option value="top">Top Applauded</option>

            <option value="discussed">Most Discussed</option>
          </select>

          <SlidersHorizontal
            size={16}
            className="
                            pointer-events-none
                            absolute
                            right-2
                            top-1/2
                            -translate-y-1/2
                            text-gray-400
                        "
          />
        </div>
      </div>
    </section>
  );
}

export default CommunityToolbar;
