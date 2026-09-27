import {
  AlertCircle,
  Bookmark,
  CheckCircle2,
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
    author,

    avatar,
    time,
    source,
    title,
    content,
    image,
    imageAlt,
    nutrition,
    likes,
    comments,
    verified,
    moderationFeedback,
  } = post;

  return (
    <article className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4 transition-shadow hover:shadow-md">
      {/* ================= AUTHOR HEADER ================= */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-gray-900 truncate">
                {post.author.name}
              </span>

              {verified && (
                <CheckCircle2
                  size={16}
                  className="text-chaybook-primary shrink-0"
                />
              )}
            </div>

            <span className="text-[11px] text-gray-500">
              {time}
              {source && ` • ${source}`}
            </span>
          </div>
        </div>

        <PostStatusBadge status={status} />
      </div>

      {/* ================= DENIED FEEDBACK ================= */}
      {status === "DENIED" && moderationFeedback && (
        <div className="bg-red-50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />

          <div className="flex flex-col text-red-800 text-sm">
            <span className="font-bold">Moderation Feedback</span>

            <p className="leading-relaxed mt-0.5">{moderationFeedback}</p>
          </div>
        </div>
      )}

      {/* ================= PENDING INFO ================= */}
      {status === "PENDING" && (
        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
          <Hourglass size={18} className="text-chaybook-primary shrink-0" />

          <p className="text-sm text-gray-600">
            Under review by ChayBook verified dietitians. Review queue average
            turnaround: <strong>2–4 hours</strong>.
          </p>
        </div>
      )}

      {/* ================= CONTENT ================= */}
      <div className="space-y-1">
        <h3
          className="
            text-[22px]
            leading-7.5
            font-semibold
            text-gray-900
            hover:text-chaybook-primary
            transition-colors
          "
        >
          {title}
        </h3>

        <p className="text-[15px] leading-6 text-gray-600">{content}</p>
      </div>

      {/* ================= IMAGE ================= */}
      {image && (
        <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden relative">
          <img
            src={image}
            alt={imageAlt || title}
            className="
              w-full
              h-full
              object-cover
              hover:scale-105
              transition-transform
              duration-500
            "
          />

          {nutrition && (
            <div
              className="
              absolute
              bottom-3
              left-3
              bg-[#2d3130]/80
              text-white
              backdrop-blur-md
              px-2.5
              py-1
              rounded-full
              text-[11px]
              flex
              items-center
              gap-1
            "
            >
              {nutrition}
            </div>
          )}
        </div>
      )}

      {/* ================= INTERACTION ================= */}
      {status === "APPROVED" && (
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => onLike?.(post)}
              className="
                flex items-center gap-1
                text-sm
                text-gray-600
                hover:text-chaybook-primary
                transition-colors
              "
            >
              <ThumbsUp size={19} className="text-chaybook-primary" />

              <span>{likes} likes</span>
            </button>

            <button
              type="button"
              onClick={() => onComment?.(post)}
              className="
                flex items-center gap-1
                text-sm
                text-gray-600
                hover:text-chaybook-primary
                transition-colors
              "
            >
              <MessageCircle size={19} />

              <span>{comments} comments</span>
            </button>

            <button
              type="button"
              onClick={() => onShare?.(post)}
              className="
                hidden sm:flex
                items-center gap-1
                text-sm
                text-gray-600
                hover:text-chaybook-primary
                transition-colors
              "
            >
              <Share2 size={19} />

              <span>Share</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onBookmark?.(post)}
              className="
                p-1.5
                rounded-lg
                text-gray-500
                hover:bg-gray-100
                transition-colors
              "
              title="Bookmark"
            >
              <Bookmark size={20} />
            </button>

            <button
              type="button"
              onClick={() => onMore?.(post)}
              className="
                p-1.5
                rounded-lg
                text-gray-500
                hover:bg-gray-100
                transition-colors
              "
              title="More options"
            >
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ================= DENIED ACTIONS ================= */}
      {status === "DENIED" && (
        <div
          className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
          bg-gray-50
          p-3
          rounded-xl
        "
        >
          <span className="text-[11px] text-gray-500">
            You can edit the post and resubmit anytime.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDelete?.(post)}
              className="
                flex items-center gap-1
                px-2 py-1
                text-sm
                text-red-600
                hover:underline
              "
            >
              <Trash2 size={15} />
              Delete Draft
            </button>

            <button
              type="button"
              onClick={() => onEdit?.(post)}
              className="
                flex items-center gap-1
                px-3 py-1.5
                rounded-lg
                bg-white
                text-red-600
                hover:bg-red-50
                text-sm
                font-semibold
                shadow-sm
              "
            >
              <Edit3 size={16} />
              Edit & Resubmit
            </button>
          </div>
        </div>
      )}

      {/* ================= PENDING ACTIONS ================= */}
      {status === "PENDING" && (
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
            text-[11px]
            text-gray-500
            flex
            items-center
            gap-1
          "
          >
            <LockKeyhole size={14} />
            Locked during verification
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onWithdraw?.(post)}
              className="
                px-3
                py-1
                rounded-lg
                text-sm
                text-gray-600
                hover:bg-gray-100
              "
            >
              Withdraw Submission
            </button>

            <button
              type="button"
              onClick={() => onEdit?.(post)}
              className="
                px-3
                py-1
                rounded-lg
                bg-gray-100
                hover:bg-gray-200
                text-gray-800
                text-sm
                font-medium
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
