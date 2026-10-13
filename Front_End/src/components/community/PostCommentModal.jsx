import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bookmark,
  CornerDownRight,
  Edit3,
  Loader2,
  MessageCircle,
  Send,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";

import Avatar from "../common/Avatar";
import API_BASE_URL from "../../services/app";
import { useAuth } from "../../context/useAuth";
import {
  createComment,
  deleteComment,
  getCommentReplies,
  getPostComments,
  updateComment,
} from "../../services/commentServices";

const API_ORIGIN = new URL(API_BASE_URL).origin;

function formatRelativeTime(dateString) {
  if (!dateString) return "Vừa xong";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Vừa xong";

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function resolveImageUrl(image) {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `${API_ORIGIN}${image.startsWith("/") ? "" : "/"}${image}`;
}

export default function PostCommentModal({
  isOpen,
  post,
  onClose,
  onLike,
  onBookmark,
  onCommentCountChange,
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [totalCommentCount, setTotalCommentCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentError, setCommentError] = useState("");

  // Input state
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null); // { commentId, authorName }

  // Replies expansion state: map rootCommentId -> { replies: [], page: 0, hasNext: false, loading: false, expanded: false }
  const [repliesState, setRepliesState] = useState({});

  // Editing state: { commentId: number, content: string }
  const [editingComment, setEditingComment] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Deleting state: commentId in progress
  const [deletingId, setDeletingId] = useState(null);

  const inputRef = useRef(null);
  const commentsContainerRef = useRef(null);

  const postId = post?.postId ?? post?.id;

  // 1. Tải danh sách comment gốc
  const loadComments = useCallback(
    async (pageNumber = 0, append = false) => {
      if (!postId) return;

      if (pageNumber === 0) {
        setLoadingComments(true);
      } else {
        setLoadingMore(true);
      }
      setCommentError("");

      try {
        const response = await getPostComments(postId, pageNumber, 10);
        const items = Array.isArray(response?.items) ? response.items : [];

        if (append) {
          setComments((prev) => [...prev, ...items]);
        } else {
          setComments(items);
        }

        setPage(response?.page ?? pageNumber);
        setHasNext(Boolean(response?.hasNext));
        const count = Number(response?.totalCommentCount ?? 0);
        setTotalCommentCount(count);
        onCommentCountChange?.(postId, count);
      } catch (err) {
        console.error("Không thể tải bình luận:", err);
        setCommentError("Không thể tải danh sách bình luận. Vui lòng thử lại.");
      } finally {
        setLoadingComments(false);
        setLoadingMore(false);
      }
    },
    [postId, onCommentCountChange],
  );

  useEffect(() => {
    if (!isOpen || !postId) return;

    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        loadComments(0, false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, postId, loadComments]);

  // Khóa scroll body khi modal mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !post) return null;

  // 2. Gửi bình luận mới hoặc phản hồi
  const handleSubmitComment = async (e) => {
    e?.preventDefault();
    const content = inputText.trim();
    if (!content || isSubmitting) return;

    setIsSubmitting(true);
    setCommentError("");

    try {
      const response = await createComment(postId, {
        content,
        replyToCommentId: replyTarget?.commentId ?? null,
      });

      const newComment = response?.comment;
      const updatedTotalCount = Number(
        response?.totalCommentCount ?? totalCommentCount + 1,
      );
      setTotalCommentCount(updatedTotalCount);
      onCommentCountChange?.(postId, updatedTotalCount);

      setInputText("");
      setReplyTarget(null);

      // Phân biệt: bình luận trả lời (reply) hay bình luận gốc (root)
      // Đối với comment gốc: newComment.parentCommentId là null
      // Đối với reply: newComment.parentCommentId là ID của comment gốc
      const isReply = Boolean(newComment?.parentCommentId);

      if (isReply) {
        const rootId = response?.rootCommentId || newComment.parentCommentId;

        // Cập nhật số phản hồi cho comment gốc
        setComments((prev) =>
          prev.map((c) =>
            c.commentId === rootId
              ? {
                  ...c,
                  replyCount: Number(
                    response?.rootReplyCount ?? (c.replyCount || 0) + 1,
                  ),
                }
              : c,
          ),
        );

        // Thêm reply mới vào danh sách replies và tự động mở nhánh đó ra
        if (newComment) {
          setRepliesState((prev) => {
            const current = prev[rootId] || {
              replies: [],
              page: 0,
              hasNext: false,
              loading: false,
            };
            return {
              ...prev,
              [rootId]: {
                ...current,
                expanded: true,
                replies: [...(current.replies || []), newComment],
              },
            };
          });
        }
      } else if (newComment) {
        // Bình luận gốc mới -> Đưa ngay vào đầu danh sách bình luận hiển thị!
        setComments((prev) => {
          if (prev.some((c) => c.commentId === newComment.commentId)) {
            return prev;
          }
          return [newComment, ...prev];
        });

        // Cuộn mượt lên đầu khung chat để thấy ngay bình luận vừa đăng
        if (commentsContainerRef.current) {
          commentsContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        // Fallback: Tải lại nếu backend không trả về đối tượng comment
        loadComments(0, false);
      }
    } catch (err) {
      console.error("Lỗi gửi bình luận:", err);
      setCommentError(
        err.message || "Không thể gửi bình luận. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Mở/đóng replies của một root comment
  const handleToggleReplies = async (rootId) => {
    const current = repliesState[rootId];

    if (current?.expanded) {
      setRepliesState((prev) => ({
        ...prev,
        [rootId]: { ...prev[rootId], expanded: false },
      }));
      return;
    }

    // Nếu chưa tải replies lần nào
    if (!current?.replies || current.replies.length === 0) {
      setRepliesState((prev) => ({
        ...prev,
        [rootId]: { ...prev[rootId], loading: true, expanded: true },
      }));

      try {
        const response = await getCommentReplies(postId, rootId, 0, 10);
        const items = Array.isArray(response?.items) ? response.items : [];
        setRepliesState((prev) => ({
          ...prev,
          [rootId]: {
            replies: items,
            page: response?.page ?? 0,
            hasNext: Boolean(response?.hasNext),
            loading: false,
            expanded: true,
          },
        }));
      } catch (err) {
        console.error("Không thể tải phản hồi:", err);
        setRepliesState((prev) => ({
          ...prev,
          [rootId]: { ...prev[rootId], loading: false, expanded: false },
        }));
      }
    } else {
      setRepliesState((prev) => ({
        ...prev,
        [rootId]: { ...prev[rootId], expanded: true },
      }));
    }
  };

  // 4. Bắt đầu trả lời một người
  const handleStartReply = (targetComment) => {
    setReplyTarget({
      commentId: targetComment.commentId,
      authorName:
        targetComment.author?.displayName ||
        targetComment.author?.username ||
        "thành viên",
    });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // 5. Cập nhật bình luận
  const handleSaveEdit = async (commentId) => {
    if (!editingComment || !editingComment.content.trim()) return;

    setIsUpdating(true);
    try {
      const response = await updateComment(
        postId,
        commentId,
        editingComment.content.trim(),
      );
      const updated = response?.comment;

      // Cập nhật trong root list
      setComments((prev) =>
        prev.map((c) =>
          c.commentId === commentId
            ? {
                ...c,
                content: updated?.content ?? editingComment.content,
                editedAt: updated?.editedAt ?? new Date().toISOString(),
              }
            : c,
        ),
      );

      // Cập nhật trong replies list (nếu có)
      setRepliesState((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((rId) => {
          if (next[rId]?.replies) {
            next[rId] = {
              ...next[rId],
              replies: next[rId].replies.map((reply) =>
                reply.commentId === commentId
                  ? {
                      ...reply,
                      content: updated?.content ?? editingComment.content,
                      editedAt: updated?.editedAt ?? new Date().toISOString(),
                    }
                  : reply,
              ),
            };
          }
        });
        return next;
      });

      setEditingComment(null);
    } catch (err) {
      console.error("Lỗi cập nhật bình luận:", err);
      alert(err.message || "Không thể cập nhật bình luận.");
    } finally {
      setIsUpdating(false);
    }
  };

  // 6. Xóa bình luận
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này không?"))
      return;

    setDeletingId(commentId);
    try {
      const response = await deleteComment(postId, commentId);
      const updatedCount = Number(
        response?.totalCommentCount ?? Math.max(0, totalCommentCount - 1),
      );
      setTotalCommentCount(updatedCount);
      onCommentCountChange?.(postId, updatedCount);

      // Cập nhật trạng thái hiển thị
      setComments((prev) =>
        prev.map((c) =>
          c.commentId === commentId
            ? {
                ...c,
                status: "DELETED",
                content: "",
              }
            : c,
        ),
      );

      setRepliesState((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((rId) => {
          if (next[rId]?.replies) {
            next[rId] = {
              ...next[rId],
              replies: next[rId].replies.map((reply) =>
                reply.commentId === commentId
                  ? {
                      ...reply,
                      status: "DELETED",
                      content: "",
                    }
                  : reply,
              ),
            };
          }
        });
        return next;
      });
    } catch (err) {
      console.error("Lỗi xóa bình luận:", err);
      alert(err.message || "Không thể xóa bình luận.");
    } finally {
      setDeletingId(null);
    }
  };

  const isLiked = Boolean(post.likedByCurrentUser);
  const isBookmarked = Boolean(post.bookmarkedByCurrentUser);
  const likes = post.likeCount ?? post.stats?.likes ?? 0;
  const postImageUrl = resolveImageUrl(post.imageUrl ?? post.image);
  const postAuthorName =
    post.username ??
    post.author?.name ??
    post.author?.displayName ??
    "Thành viên";
  const postAuthorAvatar = post.avatarUrl ?? post.author?.avatar;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex flex-col md:flex-row w-full max-w-5xl h-[92vh] max-h-[850px] overflow-hidden rounded-2xl md:rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng modal góc trên phải mobile / tablet */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 z-20 md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
          title="Đóng"
        >
          <X size={18} />
        </button>

        {/* ================= CỘT TRÁI: CHI TIẾT BÀI VIẾT ================= */}
        <div className="flex flex-col w-full md:w-[48%] border-b md:border-b-0 md:border-r border-gray-100 bg-[#fafcfa] overflow-y-auto shrink-0 max-h-[42vh] md:max-h-full">
          {/* Header tác giả bài viết */}
          <div className="flex items-center gap-3 p-4 sm:p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
            <Avatar src={postAuthorAvatar} alt={postAuthorName} size="md" />
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-bold text-gray-900">
                {postAuthorName}
              </h4>
              <p className="text-[11px] text-gray-500">
                {formatRelativeTime(post.createdAt || post.time)}
              </p>
            </div>
            {post.categoryName && (
              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {post.categoryName}
              </span>
            )}
          </div>

          {/* Nội dung bài viết */}
          <div className="p-4 sm:p-6 space-y-4 flex-1">
            {post.title && (
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                {post.title}
              </h2>
            )}

            <div className="text-sm sm:text-[15px] leading-relaxed text-gray-700 whitespace-pre-wrap break-words">
              {post.content || post.description}
            </div>

            {postImageUrl && (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
                <img
                  src={postImageUrl}
                  alt={post.title || "Post image"}
                  className="w-full max-h-[380px] object-cover"
                />
              </div>
            )}
          </div>

          {/* Thanh tương tác bài viết (Like, Bookmark) */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 p-3 sm:p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onLike?.(post)}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                  isLiked
                    ? "text-chaybook-primary font-bold"
                    : "text-gray-600 hover:text-chaybook-primary"
                }`}
              >
                <ThumbsUp
                  size={18}
                  className={`transition-transform active:scale-125 ${
                    isLiked ? "fill-current" : ""
                  }`}
                />
                <span>{likes} Thích</span>
              </button>

              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
                <MessageCircle size={18} />
                <span>{totalCommentCount} Bình luận</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onBookmark?.(post)}
              className={`rounded-lg p-2 transition-colors ${
                isBookmarked
                  ? "bg-emerald-50 text-chaybook-primary"
                  : "text-gray-500 hover:bg-gray-100 hover:text-chaybook-primary"
              }`}
              title={isBookmarked ? "Bỏ lưu bài viết" : "Lưu bài viết"}
            >
              <Bookmark
                size={18}
                className={isBookmarked ? "fill-current" : ""}
              />
            </button>
          </div>
        </div>

        {/* ================= CỘT PHẢI: KHU VỰC BÌNH LUẬN ================= */}
        <div className="flex flex-col flex-1 bg-white min-w-0 h-full">
          {/* Header bình luận */}
          <div className="hidden md:flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">Bình luận</h3>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                {totalCommentCount}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Đóng"
            >
              <X size={19} />
            </button>
          </div>

          {/* Danh sách bình luận */}
          <div
            ref={commentsContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
          >
            {commentError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{commentError}</span>
              </div>
            )}

            {loadingComments ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                <Loader2
                  size={28}
                  className="animate-spin text-chaybook-primary"
                />
                <span className="text-xs font-medium">
                  Đang tải bình luận...
                </span>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-chaybook-primary mb-3">
                  <MessageCircle size={26} />
                </div>
                <h4 className="text-sm font-semibold text-gray-700">
                  Chưa có bình luận nào
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Hãy là người đầu tiên chia sẻ cảm nghĩ về bài viết này!
                </p>
              </div>
            ) : (
              <>
                {comments.map((rootComment) => (
                  <CommentItem
                    key={rootComment.commentId}
                    comment={rootComment}
                    onStartReply={handleStartReply}
                    onStartEdit={(c) =>
                      setEditingComment({
                        commentId: c.commentId,
                        content: c.content,
                      })
                    }
                    onDelete={handleDeleteComment}
                    isDeleting={deletingId === rootComment.commentId}
                    editingComment={editingComment}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingComment(null)}
                    isUpdating={isUpdating}
                    onToggleReplies={handleToggleReplies}
                    repliesInfo={repliesState[rootComment.commentId]}
                    onUpdateEditingContent={(content) =>
                      setEditingComment((prev) => ({ ...prev, content }))
                    }
                  />
                ))}

                {hasNext && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() => loadComments(page + 1, true)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Đang tải thêm...</span>
                        </>
                      ) : (
                        <span>Xem thêm bình luận cũ hơn</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Input để nhập bình luận */}
          <div className="border-t border-gray-100 bg-white p-3 sm:p-4">
            {replyTarget && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-emerald-50/80 px-3 py-1.5 text-xs text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <CornerDownRight
                    size={13}
                    className="text-chaybook-primary"
                  />
                  Đang trả lời <strong>@{replyTarget.authorName}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="rounded p-0.5 hover:bg-emerald-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <form
              onSubmit={handleSubmitComment}
              className="flex items-end gap-2.5"
            >
              <Avatar
                src={user?.avatarUrl}
                alt={user?.fullName || "You"}
                size="sm"
                className="mb-1"
              />

              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                  rows={2}
                  maxLength={2000}
                  placeholder={
                    replyTarget
                      ? `Trả lời @${replyTarget.authorName}...`
                      : "Viết bình luận của bạn (Enter để gửi)..."
                  }
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/60 p-2.5 text-sm text-gray-800 outline-none transition focus:border-chaybook-primary focus:bg-white focus:ring-1 focus:ring-chaybook-primary"
                />
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || isSubmitting}
                className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chaybook-primary text-white shadow-sm transition hover:bg-chaybook-hover disabled:cursor-not-allowed disabled:opacity-40"
                title="Gửi bình luận"
              >
                {isSubmitting ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Send size={17} />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Component hiển thị một Comment (Root comment + Danh sách replies lồng nhau)
 */
function CommentItem({
  comment,
  isReply = false,
  onStartReply,
  onStartEdit,
  onDelete,
  isDeleting,
  editingComment,
  onSaveEdit,
  onCancelEdit,
  isUpdating,
  onToggleReplies,
  repliesInfo,
  onUpdateEditingContent,
}) {
  const isDeleted = comment.status === "DELETED";
  const isEditing = editingComment?.commentId === comment.commentId;
  const authorName = comment.author?.displayName || "Thành viên";
  const authorAvatar = comment.author?.avatarUrl;
  const permissions = comment.permissions || {};

  return (
    <div
      className={`flex gap-2.5 group ${isReply ? "ml-8 sm:ml-10 mt-3" : ""}`}
    >
      <Avatar
        src={authorAvatar}
        alt={authorName}
        size={isReply ? "sm" : "sm"}
        className="mt-0.5"
      />

      <div className="flex-1 min-w-0">
        <div className="rounded-2xl bg-gray-50/90 hover:bg-gray-100/70 transition-colors p-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-gray-900 text-xs sm:text-sm">
                {authorName}
              </span>

              {comment.replyTo?.author?.displayName && (
                <span className="text-[11px] text-gray-500 font-medium">
                  trả lời{" "}
                  <strong className="text-emerald-700">
                    @{comment.replyTo.author.displayName}
                  </strong>
                </span>
              )}
            </div>

            <span className="text-[10px] text-gray-400 shrink-0">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>

          {/* Nội dung bình luận */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editingComment.content}
                onChange={(e) => onUpdateEditingContent(e.target.value)}
                rows={2}
                maxLength={2000}
                className="w-full resize-none rounded-lg border border-gray-300 p-2 text-xs sm:text-sm text-gray-800 outline-none focus:border-chaybook-primary focus:ring-1 focus:ring-chaybook-primary"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={isUpdating}
                  className="rounded-lg px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => onSaveEdit(comment.commentId)}
                  disabled={!editingComment.content.trim() || isUpdating}
                  className="rounded-lg bg-chaybook-primary px-3 py-1 text-xs font-semibold text-white hover:bg-chaybook-hover transition-colors disabled:opacity-50"
                >
                  {isUpdating ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          ) : isDeleted ? (
            <p className="text-xs text-gray-400 italic">Bình luận đã bị xóa</p>
          ) : (
            <div className="text-gray-700 whitespace-pre-wrap break-words leading-relaxed text-xs sm:text-[13px]">
              {comment.content}
              {comment.editedAt && (
                <span className="ml-1.5 text-[10px] text-gray-400">
                  (đã chỉnh sửa)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action bar: Trả lời, Sửa, Xóa */}
        {!isDeleted && !isEditing && (
          <div className="mt-1 flex items-center gap-3 px-2 text-[11px] font-semibold text-gray-500">
            {permissions.canReply && (
              <button
                type="button"
                onClick={() => onStartReply(comment)}
                className="hover:text-chaybook-primary transition-colors cursor-pointer"
              >
                Trả lời
              </button>
            )}

            {permissions.canEdit && (
              <button
                type="button"
                onClick={() => onStartEdit(comment)}
                className="hover:text-chaybook-primary transition-colors cursor-pointer flex items-center gap-1"
              >
                <Edit3 size={11} />
                Sửa
              </button>
            )}

            {permissions.canDelete && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => onDelete(comment.commentId)}
                className="hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1 text-gray-400 hover:text-red-600"
              >
                <Trash2 size={11} />
                {isDeleting ? "Đang xóa..." : "Xóa"}
              </button>
            )}
          </div>
        )}

        {/* Nút xem phản hồi (chỉ có ở root comment) */}
        {!isReply && comment.replyCount > 0 && (
          <div className="mt-2 pl-2">
            <button
              type="button"
              onClick={() => onToggleReplies?.(comment.commentId)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-chaybook-primary hover:underline cursor-pointer"
            >
              <CornerDownRight size={13} />
              <span>
                {repliesInfo?.expanded
                  ? "Ẩn phản hồi"
                  : `Xem ${comment.replyCount} phản hồi`}
              </span>
            </button>

            {/* Danh sách phản hồi con */}
            {repliesInfo?.expanded && (
              <div className="mt-2 space-y-3">
                {repliesInfo.loading ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-gray-400 ml-8">
                    <Loader2
                      size={13}
                      className="animate-spin text-chaybook-primary"
                    />
                    <span>Đang tải phản hồi...</span>
                  </div>
                ) : (
                  repliesInfo.replies?.map((reply) => (
                    <CommentItem
                      key={reply.commentId}
                      comment={reply}
                      isReply={true}
                      onStartReply={onStartReply}
                      onStartEdit={onStartEdit}
                      onDelete={onDelete}
                      isDeleting={isDeleting}
                      editingComment={editingComment}
                      onSaveEdit={onSaveEdit}
                      onCancelEdit={onCancelEdit}
                      isUpdating={isUpdating}
                      onUpdateEditingContent={onUpdateEditingContent}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
