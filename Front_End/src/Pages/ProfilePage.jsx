import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";

import Input from "../components/common/Input";
import Button from "../components/common/Button";

import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileSidebar from "../components/profile/ProfileSidebar";

import PostCard from "../components/post/PostCard";
import CreatePostModal from "../components/community/CreatePostModal";
import PostCommentModal from "../components/community/PostCommentModal";

import { getMyProfile } from "../services/userServices";
import { getCategories } from "../services/categoryServices";
import {
  addPostInteraction,
  createPost,
  deletePost,
  removePostInteraction,
  updatePost,
  withdrawPost,
} from "../services/postServices";

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPostForComments, setSelectedPostForComments] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [pendingPostActionId, setPendingPostActionId] = useState(null);

  const handleCommentCountChange = useCallback(
    (targetPostId, newTotalCount) => {
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          (p.postId ?? p.id) === targetPostId
            ? {
                ...p,
                commentCount: newTotalCount,
                stats: { ...(p.stats || {}), comments: newTotalCount },
              }
            : p,
        ),
      );

      setSelectedPostForComments((prev) => {
        if (!prev || (prev.postId ?? prev.id) !== targetPostId) return prev;
        if (
          (prev.commentCount ?? prev.stats?.comments ?? 0) === newTotalCount
        ) {
          return prev;
        }

        return {
          ...prev,
          commentCount: newTotalCount,
          stats: { ...(prev.stats || {}), comments: newTotalCount },
        };
      });
    },
    [],
  );

  const [activeStatus, setActiveStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Tải profile + bài viết từ Backend API

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getMyProfile();

      setProfile(data);
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      setError(null);
    } catch (err) {
      console.error("Không thể tải profile:", err);
      setError("Không thể kết nối đến máy chủ để tải thông tin cá nhân.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const refreshProfileOnFocus = () => {
      if (document.visibilityState === "visible") {
        fetchProfile();
      }
    };

    window.addEventListener("focus", refreshProfileOnFocus);
    return () => window.removeEventListener("focus", refreshProfileOnFocus);
  }, [fetchProfile]);

  // Callback nhận dữ liệu user mới sau khi chỉnh sửa profile thành công.
  // Merge vào state profile hiện tại để UI cập nhật ngay (không cần reload).
  const handleProfileUpdated = useCallback((updatedUser) => {
    setProfile((prev) => ({
      ...prev,
      ...updatedUser,
    }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const data = await getMyProfile();

        if (cancelled) return;

        setProfile(data);
        setPosts(Array.isArray(data.posts) ? data.posts : []);
        setError(null);
      } catch (err) {
        if (cancelled) return;

        console.error("Không thể tải profile:", err);
        setError("Không thể kết nối đến máy chủ để tải thông tin cá nhân.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    getCategories("POST")
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch((categoryLoadError) => {
        console.error("Không thể tải danh mục:", categoryLoadError);
        if (!cancelled) {
          setCategoryError(categoryLoadError.message || "Không thể tải danh mục.");
        }
      })
      .finally(() => {
        if (!cancelled) setCategoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreatePost = async (postData) => {
    await createPost(postData);
    setIsCreatePostOpen(false);
    setFeedbackIsError(false);
    setFeedbackMessage("Bài viết đã được gửi thành công và đang chờ ban quản trị duyệt!");

    try {
      const data = await getMyProfile();
      setProfile(data);
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      setError(null);
    } catch (refreshError) {
      console.error("Bài viết đã được gửi nhưng không thể tải lại profile:", refreshError);
      setFeedbackIsError(false);
      setFeedbackMessage(
        "Bài viết đã được gửi và đang chờ duyệt, nhưng không thể làm mới danh sách bài viết.",
      );
    }
  };

  // 2. Lọc và sắp xếp bài viết
  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const normalizedFilter = activeStatus.toUpperCase();

    return posts.filter((post) => {
      const normalizedStatus = String(post.status || "").trim().toUpperCase();
      const matchesStatus =
        normalizedFilter === "ALL" ||
        (normalizedFilter === "REJECTED"
          ? normalizedStatus === "REJECTED" || normalizedStatus === "DENIED"
          : normalizedStatus === normalizedFilter);

      const matchesSearch =
        !query ||
        (post.title || "").toLowerCase().includes(query) ||
        (post.content || "").toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [posts, activeStatus, searchQuery]);

  const statusCount = {
    ALL: posts.length,
    APPROVED: posts.filter((p) => String(p.status || "").trim().toUpperCase() === "APPROVED").length,
    PENDING: posts.filter((p) => String(p.status || "").trim().toUpperCase() === "PENDING").length,
    REJECTED: posts.filter((p) =>
      ["REJECTED", "DENIED"].includes(String(p.status || "").trim().toUpperCase())).length,
  };

  // 3. Chuẩn hóa post data cho PostCard
  const normalizePost = (post) => ({
    ...post,
    id: post.postId ?? post.id,
    description: post.content ?? post.description,
    image: post.imageUrl ?? post.image,
    moderationFeedback: post.adminReason ?? post.moderationFeedback,
    time: post.createdAt
      ? new Date(post.createdAt).toLocaleDateString("vi-VN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : post.time || "Vừa xong",
    author: {
      name: post.username ?? profile?.username ?? "ChayBook User",
      fullName: post.username ?? profile?.username ?? "ChayBook User",
      avatarUrl: post.avatarUrl ?? profile?.avatarUrl,
      initials: (post.username || profile?.username || "CB")
        .slice(0, 2)
        .toUpperCase(),
    },
    stats: {
      likes: post.likeCount ?? post.stats?.likes ?? 0,
      comments: post.commentCount ?? post.stats?.comments ?? 0,
    },
    likedByCurrentUser: post.likedByCurrentUser,
    bookmarkedByCurrentUser: post.bookmarkedByCurrentUser,
  });

  // 4. Like / Unlike bài viết
  const handleLike = async (post) => {
    const postId = post.postId ?? post.id;
    const isCurrentlyLiked = post.likedByCurrentUser;
    const currentLikes = post.likeCount ?? post.stats?.likes ?? 0;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if ((p.postId ?? p.id) !== postId) return p;

        const nextLikes = isCurrentlyLiked
          ? Math.max(0, currentLikes - 1)
          : currentLikes + 1;

        return {
          ...p,
          likedByCurrentUser: !isCurrentlyLiked,
          likeCount: nextLikes,
        };
      }),
    );

    // Update selected post if it's the one being liked
    setSelectedPostForComments((prev) => {
      if (!prev) return null;
      if ((prev.postId ?? prev.id) !== postId) return prev;

      const nextLikes = isCurrentlyLiked
        ? Math.max(0, currentLikes - 1)
        : currentLikes + 1;

      return {
        ...prev,
        likedByCurrentUser: !isCurrentlyLiked,
        likeCount: nextLikes,
      };
    });

    try {
      if (isCurrentlyLiked) {
        await removePostInteraction(postId, "LIKE");
      } else {
        await addPostInteraction(postId, "LIKE");
      }
    } catch (err) {
      console.error("Lỗi khi Like bài viết:", err);
      await fetchProfile(false);
    }
  };

  // 5. Bookmark / Unbookmark bài viết
  const handleBookmark = async (post) => {
    const postId = post.postId ?? post.id;
    const isCurrentlyBookmarked = post.bookmarkedByCurrentUser;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if ((p.postId ?? p.id) !== postId) return p;

        return {
          ...p,
          bookmarkedByCurrentUser: !isCurrentlyBookmarked,
        };
      }),
    );

    setSelectedPostForComments((prev) => {
      if (!prev || (prev.postId ?? prev.id) !== postId) return prev;

      return {
        ...prev,
        bookmarkedByCurrentUser: !isCurrentlyBookmarked,
      };
    });

    try {
      if (isCurrentlyBookmarked) {
        await removePostInteraction(postId, "BOOKMARK");
      } else {
        await addPostInteraction(postId, "BOOKMARK");
      }
    } catch (err) {
      console.error("Lỗi khi Bookmark bài viết:", err);
      await fetchProfile(false);
    }
  };

  const handleComment = (post) => {
    setSelectedPostForComments(post);
  };

  const handleShare = (post) => {
    console.log("Share:", post.postId ?? post.id);
  };

  const handleMore = (post) => {
    console.log("More:", post.postId ?? post.id);
  };

  const handleEdit = (post) => {
    if (!["PENDING", "REJECTED", "DENIED"].includes(String(post.status || "").trim().toUpperCase()) ||
        pendingPostActionId != null) return;
    setFeedbackMessage("");
    setFeedbackIsError(false);
    setEditingPost(post);
  };

  const handleDelete = async (post) => {
    const postId = post.postId ?? post.id;
    if (!postId || pendingPostActionId != null) return;
    if (!window.confirm("Bạn có chắc muốn xóa bài viết bị từ chối này không?")) return;

    setPendingPostActionId(postId);
    setFeedbackMessage("");
    setFeedbackIsError(false);
    try {
      await deletePost(postId);
      setPosts((current) => current.filter((item) => (item.postId ?? item.id) !== postId));
      setProfile((current) => current
        ? {
            ...current,
            posts: (current.posts || []).filter((item) => (item.postId ?? item.id) !== postId),
          }
        : current);
      setFeedbackMessage("Đã xóa bài viết.");
    } catch (deleteError) {
      console.error("Không thể xóa bài viết:", deleteError);
      setFeedbackIsError(true);
      setFeedbackMessage(deleteError.message || "Không thể xóa bài viết. Vui lòng thử lại.");
    } finally {
      setPendingPostActionId(null);
    }
  };

  const handleWithdraw = async (post) => {
    const postId = post.postId ?? post.id;
    if (post.status !== "PENDING" || pendingPostActionId != null) return;
    if (!window.confirm("Bạn có chắc muốn rút bài viết đang chờ duyệt không?")) return;

    setPendingPostActionId(postId);
    setFeedbackMessage("");
    setFeedbackIsError(false);
    try {
      await withdrawPost(postId);
      setPosts((current) => current.filter((item) => (item.postId ?? item.id) !== postId));
      setProfile((current) => current
        ? {
            ...current,
            posts: (current.posts || []).filter((item) => (item.postId ?? item.id) !== postId),
          }
        : current);
      setFeedbackMessage("Đã rút bài viết khỏi hàng chờ duyệt.");
    } catch (withdrawError) {
      console.error("Không thể rút bài viết:", withdrawError);
      setFeedbackIsError(true);
      setFeedbackMessage(withdrawError.message || "Không thể rút bài viết. Vui lòng thử lại.");
    } finally {
      setPendingPostActionId(null);
    }
  };

  const handleUpdatePost = async (postData) => {
    const postId = editingPost?.postId ?? editingPost?.id;
    if (!postId) throw new Error("Không tìm thấy bài viết cần chỉnh sửa.");

    setPendingPostActionId(postId);
    try {
      const result = await updatePost(postId, postData);
      const updatedPost = {
        ...editingPost,
        title: postData.title,
        content: postData.content,
        categoryId: postData.categoryId,
        image: result.imageUrl,
        imageUrl: result.imageUrl,
        status: "PENDING",
      };
      setPosts((current) => current.map((item) =>
        (item.postId ?? item.id) === postId ? updatedPost : item));
      setProfile((current) => current
        ? {
            ...current,
            posts: (current.posts || []).map((item) =>
              (item.postId ?? item.id) === postId ? updatedPost : item),
          }
        : current);
      setEditingPost(null);
      setFeedbackIsError(false);
      setFeedbackMessage("Đã cập nhật bài viết và gửi lại để duyệt.");

      try {
        const refreshedProfile = await getMyProfile();
        setProfile(refreshedProfile);
        setPosts(Array.isArray(refreshedProfile.posts) ? refreshedProfile.posts : []);
      } catch (refreshError) {
        console.error("Bài viết đã cập nhật nhưng không thể làm mới profile:", refreshError);
      }
    } finally {
      setPendingPostActionId(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf7] text-[#181c1b] antialiased">
        <main className="w-full pt-20 bg-[#f7faf7]">
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-2xl p-8">
            <Loader2 className="h-8 w-8 animate-spin text-chaybook-primary" />
            <p className="text-sm font-medium text-gray-500">
              Đang tải thông tin cá nhân...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f7faf7] text-[#181c1b] antialiased">
        <main className="w-full pt-20 bg-[#f7faf7]">
          <div className="flex min-h-[400px] items-center justify-center rounded-2xl p-8 text-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Không thể tải thông tin
              </h2>
              <p className="mt-2 text-sm text-gray-500">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  fetchProfile();
                }}
                className="mt-4 rounded-lg bg-chaybook-primary px-4 py-2 text-sm font-medium text-white"
              >
                Thử lại
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="
      min-h-screen
      bg-[#f7faf7]
      text-[#181c1b]
      antialiased
    "
    >
      <main className="w-full pt-20 bg-[#f7faf7]">
        {/* ================= PROFILE HEADER ================= */}
        <ProfileHeader
          profile={profile}
          onProfileUpdated={handleProfileUpdated}
          onCreatePost={() => {
            setFeedbackMessage("");
            setIsCreatePostOpen(true);
          }}
        />

        {/* ================= MAIN CONTENT ================= */}
        <section
          className="
          w-full
          px-4
          md:px-8
          lg:px-12
          py-8
        "
        >
          {feedbackMessage && (
            <p
              role={feedbackIsError ? "alert" : "status"}
              className={`mx-auto mb-5 max-w-[1280px] rounded-xl border px-4 py-3 text-sm font-medium ${
                feedbackIsError
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {feedbackMessage}
            </p>
          )}
          <div
            className="
            max-w-[1280px]
            mx-auto
            grid
            grid-cols-1
            lg:grid-cols-12
            gap-8
            items-start
            
   
          "
          >
            <ProfileSidebar />

            {/* RIGHT CONTENT */}
            <section
              className="
              lg:col-span-8
              flex
              flex-col
              gap-6
              min-w-0
            "
            >
              {/* ================= POSTS HEADER ================= */}
              <div
                className="
                bg-white
                rounded-2xl
                p-4
                md:p-6
                shadow-sm
                flex
                flex-col
                gap-4
              "
              >
                <div
                  className="
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-center
                  justify-between
                  gap-3
                "
                >
                  <div className="flex items-center gap-2">
                    <h2
                      className="
                      text-[22px]
                      leading-[30px]
                      font-semibold
                      text-gray-900
                    "
                    >
                      Bài viết của tôi
                    </h2>

                    <span
                      className="
                      text-xs
                      px-2.5
                      py-0.5
                      rounded-full
                      bg-gray-100
                      text-gray-600
                      font-bold
                    "
                    >
                      ({posts.length} bài viết)
                    </span>
                  </div>

                  <div className="w-full sm:w-64">
                    <Input
                      type="search"
                      icon={Search}
                      placeholder="Tìm công thức và ghi chú của tôi..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                    />
                  </div>
                </div>

                {/* ================= STATUS FILTER ================= */}
                <div
                  className="
                  flex
                  items-center
                  gap-2
                  overflow-x-auto
                  pb-1
                "
                >
                  <StatusFilter
                    label={`Tất cả (${statusCount.ALL})`}
                    active={activeStatus === "ALL"}
                    onClick={() => setActiveStatus("ALL")}
                  />

                  <StatusFilter
                    label={`Đã duyệt (${statusCount.APPROVED})`}
                    active={activeStatus === "APPROVED"}
                    color="green"
                    onClick={() => setActiveStatus("APPROVED")}
                  />

                  <StatusFilter
                    label={`Chờ duyệt (${statusCount.PENDING})`}
                    active={activeStatus === "PENDING"}
                    color="gray"
                    onClick={() => setActiveStatus("PENDING")}
                  />

                  <StatusFilter
                    label={`Đã từ chối (${statusCount.REJECTED})`}
                    active={activeStatus === "REJECTED"}
                    color="red"
                    onClick={() => setActiveStatus("REJECTED")}
                  />
                </div>
              </div>

              {/* ================= POST LIST ================= */}
              <div className="flex flex-col gap-6">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => {
                    const normalized = normalizePost(post);

                    return (
                      <PostCard
                        key={normalized.id}
                        post={normalized}
                        onLike={() => handleLike(post)}
                        onComment={() => handleComment(post)}
                        onShare={() => handleShare(post)}
                        onBookmark={() => handleBookmark(post)}
                        onMore={() => handleMore(post)}
                        onEdit={() => handleEdit(post)}
                        onDelete={() => handleDelete(post)}
                        onWithdraw={() => handleWithdraw(post)}
                        isPendingAction={pendingPostActionId === (post.postId ?? post.id)}
                        isActionDisabled={pendingPostActionId != null}
                      />
                    );
                  })
                ) : (
                  <div
                    className="
                    bg-white
                    rounded-2xl
                    p-10
                    text-center
                    shadow-sm
                  "
                  >
                    <h3
                      className="
                      text-lg
                      font-semibold
                      text-gray-900
                      mb-2
                    "
                    >
                      {posts.length === 0
                        ? "Chưa có bài viết nào"
                        : "Không tìm thấy bài viết nào"}
                    </h3>

                    <p className="text-sm text-gray-500 mb-5">
                      {posts.length === 0
                        ? "Hãy chia sẻ bài viết đầu tiên với cộng đồng ChayBook!"
                        : "Hãy thử từ khóa hoặc bộ lọc khác."}
                    </p>

                    {posts.length > 0 && (
                      <Button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setActiveStatus("ALL");
                        }}
                      >
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </main>

      <PostCommentModal
        isOpen={Boolean(selectedPostForComments)}
        post={selectedPostForComments}
        currentUser={profile}
        onClose={() => setSelectedPostForComments(null)}
        onLike={handleLike}
        onBookmark={handleBookmark}
        onCommentCountChange={handleCommentCountChange}
      />
      {isCreatePostOpen && (
        <CreatePostModal
          isOpen={isCreatePostOpen}
          onClose={() => setIsCreatePostOpen(false)}
          onSubmit={handleCreatePost}
          categories={categories}
          categoryLoading={categoryLoading}
          categoryError={categoryError}
        />
      )}
      {editingPost && (
        <CreatePostModal
          key={`edit-post-${editingPost.postId ?? editingPost.id}`}
          isOpen
          initialPost={editingPost}
          onClose={() => setEditingPost(null)}
          onSubmit={handleUpdatePost}
          categories={categories}
          categoryLoading={categoryLoading}
          categoryError={categoryError}
        />
      )}
    </div>
  );
}

function StatusFilter({ label, active, color, onClick }) {
  const dotColor = {
    green: "bg-chaybook-primary",
    gray: "bg-gray-400",
    red: "bg-red-500",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3.5
        py-1.5
        rounded-full
        text-xs
        font-semibold
        shrink-0
        transition-colors
        ${
          active
            ? "bg-chaybook-primary text-white shadow-sm"
            : "bg-chaybook-container text-gray-600 hover:bg-[#ebefec]"
        }
      `}
    >
      {!active && color && (
        <span
          className={`
            inline-block
            w-2
            h-2
            rounded-full
            mr-1.5
            ${dotColor[color]}
          `}
        />
      )}

      {label}
    </button>
  );
}

export default ProfilePage;
