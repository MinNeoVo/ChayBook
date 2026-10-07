import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  // Phan trang
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const sentinelRef = useRef(null);

  // Modal tạo bài viết
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // 1. Tải danh sách bài viết từ backend với phân trang
  const fetchPosts = useCallback(
    async (page, showLoading = true, options = {}) => {
      if (showLoading && page === 0) {
        setLoading(true);
      }
      if (page > 0) {
        setIsFetching(true);
      }

      try {
        const categoryId = category === "all" ? null : Number(category);

        const response = await getPosts(categoryId, page, 10, options);

        // Assuming response is PageResponse: { items, page, size, totalElements, totalPages }
        if (!response || !Array.isArray(response.items)) {
          throw new Error("Dữ liệu bài viết không hợp lệ.");
        }

        if (page === 0) {
          setPosts(response.items);
          setTotalPages(response.totalPages);
          setCurrentPage(page);
        } else {
          setPosts(prevPosts => [...prevPosts, ...response.items]);
          setCurrentPage(page);
        }
        setError(null);

        return response;
      } catch (err) {
        console.error("Không thể tải bài viết:", err);

        setError("Không thể kết nối đến máy chủ để tải bài viết.");

        return false;
      } finally {
        if (showLoading && page === 0) {
          setLoading(false);
        }
        if (page > 0) {
          setIsFetching(false);
        }
      }
    },
    [category, sort],
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
    const abortController = new AbortController();

    async function loadPosts() {
      try {
        const categoryId = category === "all" ? null : Number(category);

        const response = await fetchPosts(0, true, { signal: abortController.signal });

        // If response is false, error was already set in fetchPosts
        if (response === false) {
          return;
        }
      } catch (err) {
        // Ignore if aborted
        if (err.name === "AbortError") {
          return;
        }
        console.error("Không thể tải bài viết:", err);
        setError("Không thể kết nối đến máy chủ để tải bài viết.");
      }
    }

    loadPosts();

    return () => {
      abortController.abort();
    };
  }, [category]);

  // Lọc bài viết theo từ khóa tìm kiếm (trên tiêu đề và nội dung)
  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;
    const lowerQuery = searchQuery.toLowerCase();
    return posts.filter(post => {
      const title = (post.title || '').toLowerCase();
      const content = (post.content || '').toLowerCase();
      return title.includes(lowerQuery) || content.includes(lowerQuery);
    });
  }, [posts, searchQuery]);

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

  // 4. Lấy thêm bài viết khi cuộn gần cuối trang (infinite scroll)
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching && currentPage + 1 < totalPages) {
          fetchPosts(currentPage + 1, false); // showLoading false for infinite scroll
        }
      },
      {
        rootMargin: "200px", // start loading before reaching the end
      }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [currentPage, isFetching, totalPages, fetchPosts]);

  // 5. Sắp xếp bài viết (cũ, mới)
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
      await fetchPosts(0, false);
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
                  onClick={() => fetchPosts(0, false)}
                  className="mt-4 rounded-lg bg-chaybook-primary px-4 py-2 text-sm font-medium text-white"
                >
                  Thử lại
                </button>
              </div>
            </div>
          ) : sortedPosts.length > 0 ? (
            <>
              <PostGrid
                posts={sortedPosts}
                onLike={handleLike}
                onBookmark={handleBookmark}
              />
              <div ref={sentinelRef} />
            </>
          ) : (
            <div className="flex min-h-75 items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {sortedPosts.length === 0
                    ? "Chưa có bài viết nào"
                    : "Không tìm thấy bài viết nào"}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {sortedPosts.length === 0
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
