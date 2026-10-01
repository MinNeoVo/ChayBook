import { useMemo, useState } from "react";
import { ArrowDown } from "lucide-react";

import CommunityHeader from "../components/community/CommunityHeader";
import CommunityToolbar from "../components/community/CommunityToolbar";
import PostGrid from "../components/community/PostGrid";

import { communityPosts } from "../data/communityPosts";
import CreatePostModal from "../components/community/CreatePostModal";

function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("latest");

  const filteredPosts = useMemo(() => {
    let result = [...communityPosts];

    const query = searchQuery.trim().toLowerCase();

    // Search
    if (query) {
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query) ||
          post.author.name.toLowerCase().includes(query),
      );
    }

    // Category
    if (category !== "all") {
      // Demo filter
      // Khi có DB sẽ thay bằng category từ API
      if (category === "recipes") {
        result = result.filter((post) => post.actionIcon === "fork");
      }

      if (category === "stories") {
        result = result.filter((post) => post.category?.icon === "wellness");
      }

      if (category === "nutrition") {
        result = result.filter((post) => post.category?.icon === "soup");
      }
    }

    // Sort
    if (sort === "top") {
      result.sort((a, b) => (b.stats?.likes || 0) - (a.stats?.likes || 0));
    }

    if (sort === "discussed") {
      result.sort(
        (a, b) => (b.stats?.comments || 0) - (a.stats?.comments || 0),
      );
    }

    return result;
  }, [searchQuery, category, sort]);

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const handleCreatePost = () => {
    setIsCreatePostOpen(true);
  };

  const handleCreatePostSubmit = (data) => {
    console.log("Post data:", data);

    // Sau này:
    // POST /api/posts
  };

  return (
    <div
      className="
                min-h-screen
                bg-[#f7faf7]
                text-[#181c1b]
            "
    >
      <main className="w-full pt-20">
        <div
          className="
                        mx-auto
                        flex
                        w-full
                        max-w-[1280px]
                        flex-col
                        gap-8
                        px-4
                        pb-16
                        sm:px-6
                        lg:px-12
                    "
        >
          {/* Header */}
          <CommunityHeader />

          {/* Toolbar */}
          <CommunityToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            category={category}
            setCategory={setCategory}
            sort={sort}
            setSort={setSort}
            onCreatePost={handleCreatePost}
          />

          {/* Posts */}
          {filteredPosts.length > 0 ? (
            <PostGrid posts={filteredPosts} />
          ) : (
            <div
              className="
                                flex
                                min-h-[300px]
                                items-center
                                justify-center
                                rounded-xl
                                bg-white
                                text-center
                                shadow-sm
                            "
            >
              <div>
                <h2 className="text-xl font-semibold">No posts found</h2>

                <p className="mt-2 text-sm text-gray-500">
                  Try another keyword or filter.
                </p>
              </div>
            </div>
          )}

          <CreatePostModal
            isOpen={isCreatePostOpen}
            onClose={() => setIsCreatePostOpen(false)}
            onSubmit={handleCreatePostSubmit}
          />

          {/* Load More */}
          <div
            className="
                            flex
                            flex-col
                            items-center
                            justify-center
                            gap-2
                            pt-4
                        "
          >
            <button
              type="button"
              className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-lg
                                bg-white
                                px-6
                                py-3
                                text-sm
                                font-semibold
                                text-gray-800
                                shadow-sm
                                transition-colors
                                hover:bg-[#f1f4f1]
                            "
            >
              Load More Stories
              <ArrowDown size={18} />
            </button>

            <span className="text-[11px] text-gray-400">
              Showing {filteredPosts.length} of 218 community posts
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CommunityPage;
