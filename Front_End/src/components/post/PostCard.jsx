import {
  AlertCircle,
  Bookmark,
  Edit3,
  Hourglass,
  LockKeyhole,
  MessageCircle,
  MoreVertical,
  Share2,
  ThumbsUp,
  Trash2,
} from "lucide-react";

import PostStatusBadge from "./PostStatusBadge";
import MediaRenderer from "../media/MediaRenderer";
import Avatar from "../common/Avatar";

function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onMore,
  onEdit,
  onDelete,
  onWithdraw,
  isPendingAction = false,
  isActionDisabled = false,
}) {
  const {
    status,
    time,
    source,
    title,
    description,
    content,
    image,
    imageAlt,

    stats,

    moderationFeedback,
    author,
    likedByCurrentUser,
    bookmarkedByCurrentUser,
  } = post;

  const isLiked = Boolean(likedByCurrentUser);
  const isBookmarked = Boolean(bookmarkedByCurrentUser);

  const likes = stats?.likes ?? 0;
  const comments = stats?.comments ?? 0;

  const postDescription = description || content;

  const normalizedStatus = String(status || "").trim().toUpperCase();
  const isApproved = !status || normalizedStatus === "APPROVED";
  const isDenied = normalizedStatus === "REJECTED" || normalizedStatus === "DENIED";
  const isPending = normalizedStatus === "PENDING";

  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* ================= AUTHOR HEADER ================= */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Avatar */}

          <Avatar
            src={author?.avatarUrl}
            alt={author?.fullName || "Ảnh đại diện người dùng"}
            size="md"
          />

          {/* Author information */}
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1">
              <span className="truncate text-sm font-bold text-gray-900">
                {author?.name || "Thành viên ChayBook"}
              </span>
            </div>

            <span className="text-[11px] text-gray-500">
              {time}

              {source && ` • ${source}`}
            </span>
          </div>
        </div>

        {/* Status */}
        {status && <PostStatusBadge status={status} />}
      </div>

      {/* ================= DENIED FEEDBACK ================= */}
      {isDenied && moderationFeedback && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />

          <div className="flex flex-col text-sm text-red-800">
            <span className="font-bold">Lý do từ chối</span>

            <p className="mt-0.5 leading-relaxed">{moderationFeedback}</p>
          </div>
        </div>
      )}

      {/* ================= PENDING INFO ================= */}
      {isPending && (
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
          <Hourglass size={18} className="shrink-0 text-chaybook-primary" />

          <p className="text-sm text-gray-600">
            Bài viết đang được đội ngũ ChayBook xem xét. Thời gian xử lý trung
            bình: <strong>2–4 giờ</strong>.
          </p>
        </div>
      )}

      {/* ================= CONTENT ================= */}
      <div
        className="space-y-1 cursor-pointer group/content"
        onClick={() => onComment?.(post)}
      >
        <h3
          className="
            text-[22px]
            font-semibold
            leading-7
            text-gray-900
            transition-colors
            group-hover/content:text-chaybook-primary
          "
        >
          {title}
        </h3>

        {postDescription && (
          <p className="text-[15px] leading-6 text-gray-600 line-clamp-4">
            {postDescription}
          </p>
        )}
      </div>

      {/* ================= IMAGE ================= */}

      {image && (
        <div
          className="relative h-64 w-full overflow-hidden rounded-xl md:h-80 cursor-pointer"
          onClick={() => onComment?.(post)}
        >
          <MediaRenderer
            src={image}
            alt={imageAlt || title}
            className="
        h-full
        w-full
        object-cover
        transition-transform
        duration-500
        hover:scale-105
      "
            onClick={(event) => event.stopPropagation()}
            onError={(event) => {
              console.error("Không tải được media:", event.currentTarget.src);
            }}
          />
        </div>
      )}

      {/* ================= APPROVED / COMMUNITY INTERACTION ================= */}
      {isApproved && (
        <div className="flex items-center justify-between pt-1">
          {/* Left actions */}
          <div className="flex items-center gap-5">
            {/* Like */}
            <button
              type="button"
              onClick={() => onLike?.(post)}
              className={`
                flex
                cursor-pointer
                items-center
                gap-1.5
                text-sm
                transition-all
                ${
                  isLiked
                    ? "font-bold text-chaybook-primary"
                    : "font-medium text-gray-600 hover:text-chaybook-primary"
                }
              `}
              title={isLiked ? "Bỏ thích" : "Thích"}
            >
              <ThumbsUp
                size={19}
                className={`transition-transform duration-200 active:scale-125 ${
                  isLiked
                    ? "fill-current text-chaybook-primary"
                    : "text-gray-500 hover:text-chaybook-primary"
                }`}
              />

              <span className={isLiked ? "font-bold" : ""}>{likes} lượt thích</span>
            </button>

            {/* Comment */}
            <button
              type="button"
              onClick={() => onComment?.(post)}
              className="
                flex
                cursor-pointer
                items-center
                gap-1
                text-sm
                text-gray-600
                transition-colors
                hover:text-chaybook-primary
              "
            >
              <MessageCircle size={19} />

              <span>{comments} bình luận</span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={() => onShare?.(post)}
              className="
                hidden
                cursor-pointer
                items-center
                gap-1
                text-sm
                text-gray-600
                transition-colors
                hover:text-chaybook-primary
                sm:flex
              "
            >
              <Share2 size={19} />

              <span>Chia sẻ</span>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Bookmark */}
            <button
              type="button"
              onClick={() => onBookmark?.(post)}
              className={`
                cursor-pointer
                rounded-lg
                p-1.5
                transition-all
                ${
                  isBookmarked
                    ? "bg-chaybook-primary/10 text-chaybook-primary font-bold"
                    : "text-gray-500 hover:bg-gray-100 hover:text-chaybook-primary"
                }
              `}
              title={isBookmarked ? "Bỏ lưu bài viết" : "Lưu bài viết"}
            >
              <Bookmark
                size={20}
                className={`transition-transform duration-200 active:scale-125 ${
                  isBookmarked
                    ? "fill-current text-chaybook-primary stroke-[2.5]"
                    : ""
                }`}
              />
            </button>

            {/* More */}
            <button
              type="button"
              onClick={() => onMore?.(post)}
              className="
                cursor-pointer
                rounded-lg
                p-1.5
                text-gray-500
                transition-colors
                hover:bg-gray-100
              "
              title="Tùy chọn khác"
            >
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ================= DENIED ACTIONS ================= */}
      {isDenied && (
        <div
          className="
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
            rounded-xl
            bg-gray-50
            p-3
          "
        >
          <span className="text-[11px] text-gray-500">
            Bạn có thể chỉnh sửa bài viết và gửi lại bất cứ lúc nào.
          </span>

          <div className="flex items-center gap-2">
            {/* Delete */}
            <button
              type="button"
              onClick={() => onDelete?.(post)}
              disabled={isActionDisabled}
              aria-busy={isPendingAction}
              className="
                flex
                cursor-pointer
                items-center
                gap-1
                px-2
                py-1
                text-sm
                text-red-600
                hover:underline
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Trash2 size={15} />
              {isPendingAction ? "Đang xóa..." : "Xóa bài viết"}
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => onEdit?.(post)}
              disabled={isActionDisabled}
              aria-busy={isPendingAction}
              className="
                flex
                cursor-pointer
                items-center
                gap-1
                rounded-lg
                bg-white
                px-3
                py-1.5
                text-sm
                font-semibold
                text-red-600
                shadow-sm
                hover:bg-red-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Edit3 size={16} />
              {isPendingAction ? "Đang lưu..." : "Chỉnh sửa & gửi lại"}
            </button>
          </div>
        </div>
      )}

      {/* ================= PENDING ACTIONS ================= */}
      {isPending && (
        <div
          className="
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
            pt-1
          "
        >
          <span
            className="
              flex
              items-center
              gap-1
              text-[11px]
              text-gray-500
            "
          >
            <LockKeyhole size={14} />
            Đang khóa trong thời gian kiểm duyệt
          </span>

          <div className="flex items-center gap-2">
            {/* Withdraw */}
            <button
              type="button"
              onClick={() => onWithdraw?.(post)}
              disabled={isActionDisabled}
              aria-busy={isPendingAction}
              className="
                cursor-pointer
                rounded-lg
                px-3
                py-1
                text-sm
                text-gray-600
                hover:bg-gray-100
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {isPendingAction ? "Đang xử lý..." : "Rút bài viết"}
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => onEdit?.(post)}
              disabled={isActionDisabled}
              aria-busy={isPendingAction}
              className="
                cursor-pointer
                rounded-lg
                bg-gray-100
                px-3
                py-1
                text-sm
                font-medium
                text-gray-800
                hover:bg-gray-200
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Chỉnh sửa
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export default PostCard;
