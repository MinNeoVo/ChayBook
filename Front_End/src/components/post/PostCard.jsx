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
  } = post;

  const likes = stats?.likes ?? 0;
  const comments = stats?.comments ?? 0;

  const postDescription = description || content;

  const isApproved = !status || status === "APPROVED";
  const isDenied = status === "DENIED";
  const isPending = status === "PENDING";

  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* ================= AUTHOR HEADER ================= */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Avatar */}
          {author?.avatar ? (
            <img
              src={author.avatar}
              alt={author.name}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chaybook-primary text-sm font-bold text-white">
              {author?.initials || "CB"}
            </div>
          )}

          {/* Author information */}
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1">
              <span className="truncate text-sm font-bold text-gray-900">
                {author?.name || "ChayBook User"}
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
            <span className="font-bold">Moderation Feedback</span>

            <p className="mt-0.5 leading-relaxed">{moderationFeedback}</p>
          </div>
        </div>
      )}

      {/* ================= PENDING INFO ================= */}
      {isPending && (
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
          <Hourglass size={18} className="shrink-0 text-chaybook-primary" />

          <p className="text-sm text-gray-600">
            Under review by ChayBook verified dietitians. Review queue average
            turnaround: <strong>2–4 hours</strong>.
          </p>
        </div>
      )}

      {/* ================= CONTENT ================= */}
      <div className="space-y-1 h-33 overflow-hidden">
        <h3
          className="
            text-[22px]
            font-semibold
            leading-7
            text-gray-900
            transition-colors
            hover:text-chaybook-primary
          "
        >
          {title}
        </h3>

        {postDescription && (
          <p className="text-[15px] leading-6 text-gray-600">
            {postDescription}
          </p>
        )}
      </div>

      {/* ================= IMAGE ================= */}
      {image && (
        <div className="relative h-64 w-full overflow-hidden rounded-xl md:h-80">
          <img
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
              className="
                flex
                items-center
                gap-1
                text-sm
                text-gray-600
                transition-colors
                hover:text-chaybook-primary
              "
            >
              <ThumbsUp size={19} className="text-chaybook-primary" />

              <span>{likes} likes</span>
            </button>

            {/* Comment */}
            <button
              type="button"
              onClick={() => onComment?.(post)}
              className="
                flex
                items-center
                gap-1
                text-sm
                text-gray-600
                transition-colors
                hover:text-chaybook-primary
              "
            >
              <MessageCircle size={19} />

              <span>{comments} comments</span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={() => onShare?.(post)}
              className="
                hidden
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

              <span>Share</span>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Bookmark */}
            <button
              type="button"
              onClick={() => onBookmark?.(post)}
              className="
                rounded-lg
                p-1.5
                text-gray-500
                transition-colors
                hover:bg-gray-100
              "
              title="Bookmark"
            >
              <Bookmark size={20} />
            </button>

            {/* More */}
            <button
              type="button"
              onClick={() => onMore?.(post)}
              className="
                rounded-lg
                p-1.5
                text-gray-500
                transition-colors
                hover:bg-gray-100
              "
              title="More options"
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
            You can edit the post and resubmit anytime.
          </span>

          <div className="flex items-center gap-2">
            {/* Delete */}
            <button
              type="button"
              onClick={() => onDelete?.(post)}
              className="
                flex
                items-center
                gap-1
                px-2
                py-1
                text-sm
                text-red-600
                hover:underline
              "
            >
              <Trash2 size={15} />
              Delete Draft
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => onEdit?.(post)}
              className="
                flex
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
              "
            >
              <Edit3 size={16} />
              Edit & Resubmit
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
            Locked during verification
          </span>

          <div className="flex items-center gap-2">
            {/* Withdraw */}
            <button
              type="button"
              onClick={() => onWithdraw?.(post)}
              className="
                rounded-lg
                px-3
                py-1
                text-sm
                text-gray-600
                hover:bg-gray-100
              "
            >
              Withdraw Submission
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => onEdit?.(post)}
              className="
                rounded-lg
                bg-gray-100
                px-3
                py-1
                text-sm
                font-medium
                text-gray-800
                hover:bg-gray-200
              "
            >
              Edit Details
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export default PostCard;
