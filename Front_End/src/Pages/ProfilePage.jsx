import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";

import Input from "../components/common/Input";
import Button from "../components/common/Button";

import ProfileHeader from "../components/profile/ProfileHeader";

import PostCard from "../components/post/PostCard";
import PostEditModal from "../components/profile/PostEditModal";
import PostCommentModal from "../components/community/PostCommentModal";

import { getMyProfile } from "../services/userServices";
import {
  addPostInteraction,
  removePostInteraction,
  deletePost,
} from "../services/postServices";

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPostForComments, setSelectedPostForComments] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [postNotice, setPostNotice] = useState("");
  const [postError, setPostError] = useState("");
  const [deletingPost, setDeletingPost] = useState(false);

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

  // 2. Lọc và sắp xếp bài viết
  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesStatus =
        activeStatus === "ALL" || post.status === activeStatus;

      const matchesSearch =
        !query ||
        (post.title || "").toLowerCase().includes(query) ||
        (post.content || "").toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [posts, activeStatus, searchQuery]);

  const statusCount = {
    ALL: posts.length,
    APPROVED: posts.filter((p) => p.status === "APPROVED").length,
    PENDING: posts.filter((p) => p.status === "PENDING").length,
    REJECTED: posts.filter((p) => p.status === "REJECTED").length,
  };

  // 3. Chuẩn hóa post data cho PostCard
  const normalizePost = (post) => ({
    ...post,
    id: post.postId ?? post.id,
    description: post.content ?? post.description,
    image: post.imageUrl ?? post.image,
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
    handleEdit(post);
  };

  const handleEdit = (post) => {
    if (["REMOVED", "DELETED"].includes(post.status)) return;
    setPostError(""); setEditingPost(post);
  };

  const handleDelete = async (post) => {
    if (deletingPost || ["REMOVED", "DELETED"].includes(post.status) || !window.confirm(`Delete post "${post.title}"?`)) return;
    setDeletingPost(true); setPostError("");
    try {
      await deletePost(post.postId ?? post.id);
      setSelectedPostForComments(null);
      await fetchProfile(); setPostNotice("Post deleted successfully.");
    } catch (e) { setPostError(e.message); }
    finally { setDeletingPost(false); }
  };

  const handleWithdraw = (post) => {
    handleDelete(post);
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
        />
        {postNotice && <p role="status" className="mx-auto max-w-3xl p-4 text-emerald-800">{postNotice}</p>}
        {postError && <p role="alert" className="mx-auto max-w-3xl p-4 text-red-700">{postError}</p>}
        {deletingPost && <p role="status" className="text-center">Deleting post…</p>}
        {editingPost && <PostEditModal key={editingPost.postId ?? editingPost.id} post={editingPost}
          onClose={() => setEditingPost(null)} onSaved={async () => { await fetchProfile(); setEditingPost(null); setPostNotice("Post saved for review."); }} />}

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
          <div
            className="
            max-w-[1280px]
            mx-auto
            grid
            grid-cols-1
            lg:grid-cols-12
            gap-8
            items-center
            
   
          "
          >
            {/* LEFT SIDEBAR */}

            {/* RIGHT CONTENT */}
            <section
              className="
              lg:col-span-8
              lg:col-start-3
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
                      My Posts
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
                      ({posts.length} posts)
                    </span>
                  </div>

                  <div className="w-full sm:w-64">
                    <Input
                      type="search"
                      icon={Search}
                      placeholder="Search my recipes & notes..."
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
                    label={`All (${statusCount.ALL})`}
                    active={activeStatus === "ALL"}
                    onClick={() => setActiveStatus("ALL")}
                  />

                  <StatusFilter
                    label={`Approved (${statusCount.APPROVED})`}
                    active={activeStatus === "APPROVED"}
                    color="green"
                    onClick={() => setActiveStatus("APPROVED")}
                  />

                  <StatusFilter
                    label={`Pending (${statusCount.PENDING})`}
                    active={activeStatus === "PENDING"}
                    color="gray"
                    onClick={() => setActiveStatus("PENDING")}
                  />

                  <StatusFilter
                    label={`Rejected (${statusCount.REJECTED})`}
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
