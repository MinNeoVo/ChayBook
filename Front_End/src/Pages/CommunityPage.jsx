import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import CommunityHeader from "../components/community/CommunityHeader";
import CommunityToolbar from "../components/community/CommunityToolbar";
import PostGrid from "../components/community/PostGrid";
import CreatePostModal from "../components/community/CreatePostModal";

import { getCategories } from "../services/categoryServices";

import {
  getPosts,
  createPost,
  addPostInteraction,
  removePostInteraction,
} from "../services/postServices";

function CommunityPage() {
  // Danh mục bài viết
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState("");

  // Danh sách bài viết
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tìm kiếm, danh mục và sắp xếp
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("latest");

  // Modal tạo bài viết
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // 1. Tải danh sách bài viết từ backend
  const fetchPosts = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const categoryId = category === "all" ? null : Number(category);

        const data = await getPosts(categoryId);

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
    },
    [category],
  );

  // 2. Tải danh mục từ backend
  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        setCategoryLoading(true);
        setCategoryError("");

        const data = await getCategories("POST");

        if (!Array.isArray(data)) {
          throw new Error("Dữ liệu danh mục không hợp lệ.");
        }

        if (!cancelled) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Không thể tải danh mục:", err);

        if (!cancelled) {
          setCategoryError(err.message || "Không thể tải danh mục.");
        }
      } finally {
        if (!cancelled) {
          setCategoryLoading(false);
        }
      }
    }

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // 3. Tự tải lại bài viết khi danh mục thay đổi
  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        const categoryId = category === "all" ? null : Number(category);

        const data = await getPosts(categoryId);

        if (cancelled) return;

        if (!Array.isArray(data)) {
          throw new Error("Dữ liệu bài viết không hợp lệ.");
        }

        setPosts(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;

        console.error("Không thể tải bài viết:", err);
        setError("Không thể kết nối đến máy chủ để tải bài viết.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, [category]);

  // Sắp xếp bài viết (cũ, mới)
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      // Ưu tiên bài mới hơn; nếu cùng thời gian thì ID lớn hơn trước
      if (sort === "latest") {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();

        return timeB - timeA || b.postId - a.postId;
      }

      // Ưu tiên bài có nhiều lượt thích hơn
      if (sort === "top") {
        return (
          (b.likeCount ?? 0) - (a.likeCount ?? 0) ||
          new Date(b.createdAt) - new Date(a.createdAt) ||
          b.postId - a.postId
        );
      }

      // Ưu tiên bài có nhiều bình luận hơn
      if (sort === "discussed") {
        return (
          (b.commentCount ?? 0) - (a.commentCount ?? 0) ||
          new Date(b.createdAt) - new Date(a.createdAt) ||
          b.postId - a.postId
        );
      }

      return 0;
    });
  }, [posts, sort]);

  // 5. Hiển thị thông báo
  const showFeedback = (type, text) => {
    setFeedbackMessage({ type, text });
  };

  // Tự xóa thông báo sau 5 giây
  useEffect(() => {
    if (!feedbackMessage) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setFeedbackMessage(null);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [feedbackMessage]);

  // 6. Tạo bài viết mới
  const handleCreatePost = async (formData) => {
    try {
      await createPost(formData);

      setIsCreatePostOpen(false);

      showFeedback(
        "success",
        "Bài viết đã được gửi thành công và đang chờ ban quản trị duyệt!",
      );

      // Tải lại danh sách sau khi tạo bài viết
      await fetchPosts(false);
    } catch (err) {
      console.error("Lỗi khi tạo bài viết:", err);

      showFeedback(
        "error",
        err.message || "Không thể đăng bài viết. Vui lòng thử lại.",
      );
    }
  };

  // 7. Like / Unlike bài viết
  const handleLike = async (postId) => {
    const targetPost = posts.find(
      (post) => (post.postId ?? post.id) === postId,
    );

    if (!targetPost) {
      return;
    }

    const isCurrentlyLiked = targetPost.likedByCurrentUser;

    const currentLikes = targetPost.likeCount ?? targetPost.stats?.likes ?? 0;

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
      }),
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
        "Không thể cập nhật lượt thích. Đang tải lại dữ liệu.",
      );

      await fetchPosts(false);
    }
  };

  // 8. Bookmark / Unbookmark bài viết
  const handleBookmark = async (postId) => {
    const targetPost = posts.find(
      (post) => (post.postId ?? post.id) === postId,
    );

    if (!targetPost) {
      return;
    }

    const isCurrentlyBookmarked = targetPost.bookmarkedByCurrentUser;

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
      }),
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
        "Không thể cập nhật bài viết đã lưu. Đang tải lại dữ liệu.",
      );

      await fetchPosts(false);
    }
  };

  // 9. Giao diện
  return (
    <div className="min-h-screen bg-[#f7faf7] text-on-surface">
      <main className="w-full pt-20">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 sm:px-6 lg:px-12">
          <CommunityHeader />

          {/* Thông báo */}
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

          {/* Thanh tìm kiếm, danh mục và sắp xếp */}
          <CommunityToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            category={category}
            setCategory={setCategory}
            categories={categories}
            categoryLoading={categoryLoading}
            categoryError={categoryError}
            sort={sort}
            setSort={setSort}
            onCreatePost={() => setIsCreatePostOpen(true)}
          />

          {/* Trạng thái tải bài viết */}
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
          ) : sortedPosts.length > 0 ? (
            <PostGrid
              posts={sortedPosts}
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

          {/* Modal tạo bài viết */}
          <CreatePostModal
            isOpen={isCreatePostOpen}
            onClose={() => setIsCreatePostOpen(false)}
            onSubmit={handleCreatePost}
            categories={categories}
            categoryLoading={categoryLoading}
          />
        </div>
      </main>
    </div>
  );
}

export default CommunityPage;
