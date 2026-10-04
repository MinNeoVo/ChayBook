
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import CommunityHeader from "../components/community/CommunityHeader";
import CommunityToolbar from "../components/community/CommunityToolbar";
import PostGrid from "../components/community/PostGrid";
import CreatePostModal from "../components/community/CreatePostModal";

import {
  getPosts,
  createPost,
  addPostInteraction,
  removePostInteraction,
} from "../services/postServices";

function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("latest");

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // 1. Tải bài viết thật từ Backend API
 
const fetchPosts = useCallback(async (showLoading = true) => {
  if (showLoading) {
    setLoading(true);
  }

  try {
    const data = await getPosts(
      category === "all" ? null : category
    );

    if (!Array.isArray(data)) {
      throw new Error("Dữ liệu bài viết không hợp lệ.");
    }

    setPosts(data);
    setError(null);
    return true;
  } catch (err) {
    console.error("Không thể tải bài viết:", err);

    setError("Không thể kết nối đến máy chủ để tải bài viết.");
    return false;
  } finally {
    if (showLoading) {
      setLoading(false);
    }
  }
}, [category]);

  // 2. Tải lại danh sách khi danh mục thay đổi
  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getPosts(
          category === "all" ? null : category
        );

        if (cancelled) return;

        if (!Array.isArray(data)) {
          throw new Error("Dữ liệu bài viết từ máy chủ không hợp lệ.");
        }

        setPosts(data);
      } catch (err) {
        if (cancelled) return;

        console.error("Không thể tải bài viết:", err);
        setPosts([]);
        setError(
          err.message || "Không thể kết nối đến máy chủ. Vui lòng thử lại."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, [category]);

  // 3. Lọc và sắp xếp bài viết
  const filteredPosts = useMemo(() => {
    let result = [...posts];
    const query = searchQuery.trim().toLowerCase();

    if (query) {
      result = result.filter((post) => {
        const title = (post.title || "").toLowerCase();
        const content = (
          post.content || post.description || ""
        ).toLowerCase();
        const author = (
          post.username || post.author?.name || ""
        ).toLowerCase();

        return (
          title.includes(query) ||
          content.includes(query) ||
          author.includes(query)
        );
      });
    }

    if (sort === "top") {
      result.sort((a, b) => {
        const likesA = a.likeCount ?? a.stats?.likes ?? 0;
        const likesB = b.likeCount ?? b.stats?.likes ?? 0;

        return likesB - likesA;
      });
    }

    return result;
  }, [posts, searchQuery, sort]);

  // 4. Hiển thị thông báo tạm thời
  const showFeedback = (type, text) => {
    setFeedbackMessage({ type, text });

    setTimeout(() => {
      setFeedbackMessage(null);
    }, 5000);
  };

  // 5. Tạo bài viết mới
  const handleCreatePostSubmit = async (formData) => {
    try {
      await createPost(formData);

      setIsCreatePostOpen(false);

      showFeedback(
        "success",
        "Bài viết đã được gửi thành công và đang chờ ban quản trị duyệt!"
      );

      // Tải lại bài viết sau khi tạo thành công
      await fetchPosts(false);
    } catch (err) {
      console.error("Lỗi khi tạo bài viết:", err);

      showFeedback(
        "error",
        err.message || "Không thể đăng bài viết. Vui lòng thử lại."
      );
    }
  };

  // 6. Like / Unlike bài viết
  const handleLike = async (postId) => {
    const targetPost = posts.find(
      (post) => (post.postId ?? post.id) === postId
    );

    if (!targetPost) return;

    const isCurrentlyLiked = targetPost.likedByCurrentUser;
    const currentLikes =
      targetPost.likeCount ?? targetPost.stats?.likes ?? 0;

    // Cập nhật giao diện ngay lập tức
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if ((post.postId ?? post.id) !== postId) {
          return post;
        }

        const nextLikes = isCurrentlyLiked
          ? Math.max(0, currentLikes - 1)
          : currentLikes + 1;

        return {
          ...post,
          likedByCurrentUser: !isCurrentlyLiked,
          likeCount: nextLikes,
          stats: {
            ...(post.stats || {}),
            likes: nextLikes,
          },
        };
      })
    );

    try {
      if (isCurrentlyLiked) {
        await removePostInteraction(postId, "LIKE");
      } else {
        await addPostInteraction(postId, "LIKE");
      }
    } catch (err) {
      console.error("Lỗi khi Like bài viết:", err);

      showFeedback(
        "error",
        "Không thể cập nhật lượt thích. Đang tải lại dữ liệu."
      );

      await fetchPosts(false);
    }
  };

  // 7. Bookmark / Unbookmark bài viết
  const handleBookmark = async (postId) => {
    const targetPost = posts.find(
      (post) => (post.postId ?? post.id) === postId
    );

    if (!targetPost) return;

    const isCurrentlyBookmarked =
      targetPost.bookmarkedByCurrentUser;

    // Cập nhật giao diện ngay lập tức
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if ((post.postId ?? post.id) !== postId) {
          return post;
        }

        return {
          ...post,
          bookmarkedByCurrentUser: !isCurrentlyBookmarked,
        };
      })
    );

    try {
      if (isCurrentlyBookmarked) {
        await removePostInteraction(postId, "BOOKMARK");
      } else {
        await addPostInteraction(postId, "BOOKMARK");
      }
    } catch (err) {
      console.error("Lỗi khi Bookmark bài viết:", err);

      showFeedback(
        "error",
        "Không thể cập nhật bài viết đã lưu. Đang tải lại dữ liệu."
      );

      await fetchPosts(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] text-on-surface">
      <main className="w-full pt-20">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 sm:px-6 lg:px-12">
          {/* Header */}
          <CommunityHeader />

          {/* Feedback */}
          {feedbackMessage && (
            <div
              role="status"
              className={`rounded-xl border p-4 text-sm font-medium shadow-sm ${
                feedbackMessage.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {feedbackMessage.text}
            </div>
          )}

          {/* Toolbar */}
          <CommunityToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            category={category}
            setCategory={setCategory}
            sort={sort}
            setSort={setSort}
            onCreatePost={() => setIsCreatePostOpen(true)}
          />

          {/* Loading */}
          
{loading ? (
  <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl bg-white p-8 shadow-sm">
    <Loader2 className="h-8 w-8 animate-spin text-chaybook-primary" />
    <p className="text-sm font-medium text-gray-500">
      Đang tải bài viết cộng đồng...
    </p>
  </div>
) : error ? (
  <div className="flex min-h-75 items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm">
    <div>
      <h2 className="text-xl font-semibold text-gray-800">
        Không thể kết nối máy chủ
      </h2>
      <p className="mt-2 text-sm text-gray-500">{error}</p>
      <button
        type="button"
        onClick={() => fetchPosts()}
        className="mt-4 rounded-lg bg-chaybook-primary px-4 py-2 text-sm font-medium text-white"
      >
        Thử lại
      </button>
    </div>
  </div>
) : filteredPosts.length > 0 ? (
  <PostGrid
    posts={filteredPosts}
    onLike={handleLike}
    onBookmark={handleBookmark}
  />
) : (
  <div className="flex min-h-75 items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm">
    <div>
      <h2 className="text-xl font-semibold text-gray-800">
        {posts.length === 0
          ? "Chưa có bài viết nào"
          : "Không tìm thấy bài viết nào"}
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        {posts.length === 0
          ? "Hãy là người đầu tiên chia sẻ với cộng đồng ChayBook!"
          : "Hãy thử từ khóa hoặc bộ lọc khác."}
      </p>
    </div>
  </div>
)}

          {/* Create Post Modal */}
          <CreatePostModal
            isOpen={isCreatePostOpen}
            onClose={() => setIsCreatePostOpen(false)}
            onSubmit={handleCreatePostSubmit}
          />
        </div>
      </main>
    </div>
  );
}

export default CommunityPage;

