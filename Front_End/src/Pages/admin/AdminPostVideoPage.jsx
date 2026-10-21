import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Ban,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CirclePlay,
  Clock3,
  Eye,
  FileImage,
  Info,
  ListFilter,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react";

import useAdminResource from "../../hooks/useAdminResource";
import AdminRequestState from "../../components/admin/AdminRequestState";
import {
  getAdminSubmissions,
  getAdminSubmissionStatistics,
  getAdminSubmission,
  updateAdminSubmissionStatus,
  resolveAdminMediaUrl,
} from "../../services/adminContentServices";

const PAGE_SIZE = 7;
const NUMBER_FORMAT = new Intl.NumberFormat("vi-VN");

const STAT_CARDS = [
  {
    key: "total",
    title: "Tổng bài gửi",
    description: "Bài viết và video đang chờ kiểm duyệt",
    growthTone: "green",
    Icon: FileImage,
    tone: "neutral",
  },
  {
    key: "pending",
    title: "Chờ kiểm duyệt",
    description: "Đang chờ được kiểm duyệt",
    growthTone: "neutral",
    Icon: Clock3,
    tone: "neutral",
  },
  {
    key: "approved",
    title: "Đã duyệt & hiển thị",
    description: "Đã đăng lên bảng tin",
    growthTone: "green",
    Icon: BadgeCheck,
    tone: "green",
  },
  {
    key: "rejected",
    title: "Bài đã từ chối",
    description: "Bị người kiểm duyệt từ chối",
    growthTone: "red",
    Icon: Ban,
    tone: "red",
  },
];

const GUIDELINES = [
  "Kiểm tra bài viết hoặc video có liên quan đến món ăn thực vật hoặc cộng đồng ChayBook hay không.",
  "Đảm bảo hình ảnh, âm nhạc và các nội dung đa phương tiện phù hợp để chia sẻ.",
  "Các ví dụ này chỉ dùng để minh họa giao diện, không phải quy định chính thức của ChayBook.",
];

const FILTER_RULES = [
  {
    name: "Liên kết lặp",
    detail: "Đánh dấu bài viết có liên kết bên ngoài bị lặp.",
  },
  {
    name: "Từ ngữ nhạy cảm",
    detail: "Chuyển các từ đã cấu hình cho người kiểm duyệt xem xét.",
  },
  {
    name: "Bài gửi trùng lặp",
    detail: "Đánh dấu bài gửi có tiêu đề và người đăng trùng khớp.",
  },
  {
    name: "Kiểm duyệt video",
    detail: "Giữ video trong hàng chờ cho đến khi được duyệt.",
  },
];

function formatNumber(value) {
  return NUMBER_FORMAT.format(value);
}

function toRecord(item) {
  const submitted = item.submittedAt ? new Date(item.submittedAt) : null;
  const validDate = submitted && !Number.isNaN(submitted.getTime());
  return {
    ...item,
    adminReason: item.status === "REJECTED" ? item.adminReason : null,
    thumbnailUrl: resolveAdminMediaUrl(item.thumbnailUrl),
    videoUrl: resolveAdminMediaUrl(item.mediaUrl),
    submittedDate: validDate ? submitted.toLocaleDateString("vi-VN") : "—",
    submittedTime: validDate
      ? submitted.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
  };
}

function AIResultBadge({ result }) {
  const config = {
    APPROVE: {
      label: "AI đề xuất duyệt",
      className: "bg-emerald-100 text-emerald-800",
    },
    REJECT: {
      label: "AI đề xuất từ chối",
      className: "bg-red-100 text-red-700",
    },
    NEEDS_REVIEW: {
      label: "Cần xem xét",
      className: "bg-amber-100 text-amber-800",
    },
  }[result];

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
        config?.className || "bg-slate-100 text-slate-600"
      }`}
    >
      {config?.label || "Chưa có đề xuất từ AI"}
    </span>
  );
}

function ModerationStatusBadge({ status }) {
  const config = {
    PENDING: { label: "AI đang chờ xử lý", className: "bg-slate-100 text-slate-600" },
    PROCESSING: {
      label: "AI đang xử lý",
      className: "bg-blue-100 text-blue-700",
    },
    COMPLETED: {
      label: "AI đã xử lý xong",
      className: "bg-emerald-50 text-emerald-700",
    },
    FAILED: { label: "AI xử lý thất bại", className: "bg-red-100 text-red-700" },
  }[status];

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${
        config?.className || "bg-slate-100 text-slate-600"
      }`}
    >
      {config?.label || (status ? `AI: ${status}` : "AI chưa xử lý")}
    </span>
  );
}

function AIReview({ record, compact = false }) {
  const confidenceValue =
    record.aiConfidence == null || record.aiConfidence === ""
      ? null
      : Number(record.aiConfidence);
  const confidence =
    Number.isFinite(confidenceValue) &&
    confidenceValue >= 0 &&
    confidenceValue <= 1
      ? `${Math.round(confidenceValue * 100)}%`
      : null;

  return (
    <div
      className={
        compact
          ? "mt-1.5 flex min-w-0 flex-wrap items-center gap-1"
          : "space-y-3"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <AIResultBadge result={record.aiResult} />
        <ModerationStatusBadge status={record.moderationStatus} />
        <span
          className={`text-[10px] font-medium ${
            confidence == null ? "text-slate-400" : "text-slate-600"
          }`}
          title={
            confidence == null
              ? "API kiểm duyệt AI không trả về giá trị độ tin cậy hợp lệ."
              : undefined
          }
        >
          Độ tin cậy {confidence ?? "chưa có"}
        </span>
      </div>
      {!compact && (
        <>
          <div>
            <p className="text-xs font-semibold text-slate-500">Lý do đánh giá của AI</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {record.aiReason || "AI chưa cung cấp lý do đánh giá."}
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Độ tin cậy chỉ mang tính tham khảo, không quyết định nội dung có an
            toàn hay không.
          </p>
        </>
      )}
    </div>
  );
}

function AdminRejectionReason({ record }) {
  if (record.status !== "REJECTED" || !record.adminReason) return null;
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
        Lý do quản trị viên từ chối
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-900">
        {record.adminReason}
      </p>
    </div>
  );
}

function getPageNumbers(totalPages, currentPage) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => firstPage + index);
}

function ContentThumbnail({ record, large = false, onClick }) {
  const dimensions = large ? "h-56 w-full sm:h-64" : "h-10 w-10";
  const thumbnail = (
    <span
      className={`relative block ${dimensions} shrink-0 overflow-hidden rounded-lg bg-emerald-50`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center text-2xl"
      >
        {record.type === "VIDEO" ? (
          <Video aria-hidden="true" size={large ? 32 : 16} />
        ) : (
          <FileImage aria-hidden="true" size={large ? 32 : 16} />
        )}
      </span>
      {record.thumbnailUrl && (
        <img
          src={
            large
              ? record.thumbnailUrl.replace("w=120", "w=1200")
              : record.thumbnailUrl
          }
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      )}
      {record.type === "VIDEO" && (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-slate-950/15 text-white"
        >
          <CirclePlay size={large ? 40 : 16} fill="rgba(15, 23, 42, .48)" />
        </span>
      )}
    </span>
  );

  if (!onClick) return thumbnail;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Xem ${record.type === "VIDEO" ? "video" : "bài viết"} ${record.title}`}
      className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
    >
      {thumbnail}
    </button>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    PENDING: {
      label: "Chờ duyệt",
      Icon: Clock3,
      className: "bg-slate-100 text-slate-600",
    },
    APPROVED: {
      label: "Đã duyệt",
      Icon: CircleCheck,
      className: "bg-emerald-100 text-emerald-800",
    },
    REJECTED: {
      label: "Đã từ chối",
      Icon: CircleAlert,
      className: "bg-red-100 text-red-700",
    },
  };
  const config = statusConfig[status] || {
    label: status || "Không xác định",
    Icon: Info,
    className: "bg-slate-100 text-slate-600",
  };
  const Icon = config.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold leading-none ${config.className}`}
    >
      <Icon aria-hidden="true" size={12} />
      {config.label}
    </span>
  );
}

function StatCard({ card, value }) {
  const Icon = card.Icon;
  const iconTone = {
    neutral: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  }[card.tone];
  const valueTone =
    card.tone === "green"
      ? "text-emerald-700"
      : card.tone === "red"
        ? "text-red-700"
        : "text-slate-900";
  const growthTone = {
    neutral: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  }[card.growthTone];

  return (
    <section className="min-w-0 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 truncate text-xs font-semibold text-slate-600 sm:text-sm">
          {card.title}
        </h2>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconTone}`}
        >
          <Icon aria-hidden="true" size={17} />
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p
          className={`text-2xl font-bold tracking-tight sm:text-3xl ${valueTone}`}
        >
          {value == null ? "—" : formatNumber(value)}
        </p>
        {card.growth && (
          <span
            className={`mb-1 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${growthTone}`}
          >
            {card.growth}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[11px] leading-4 text-slate-500">
        {card.description}
      </p>
    </section>
  );
}

function ModalShell({
  title,
  icon: Icon,
  onClose,
  children,
  footer,
  width = "max-w-lg",
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-post-video-dialog-title"
        className={`my-auto w-full ${width} overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-chaybook-primary">
                <Icon aria-hidden="true" size={19} />
              </span>
            )}
            <h2
              id="admin-post-video-dialog-title"
              className="text-base font-bold text-slate-900"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Đóng hộp thoại"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>
        <div className="max-h-[min(70vh,38rem)] overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4 sm:px-6">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}

function ContentSummary({ record }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <ContentThumbnail record={record} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {record.title}
        </p>
        <p className="truncate text-xs text-slate-500">
          @{record.creator} <span aria-hidden="true">·</span>{" "}
          {record.description}
        </p>
      </div>
    </div>
  );
}

function VideoPreview({ record }) {
  const [failed, setFailed] = useState(false);
  if (failed || !record.videoUrl) {
    return (
      <div className="space-y-3">
        <ContentThumbnail record={record} large />
        <p
          role="status"
          className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
        >
          {record.videoUrl ? (
            <>
              This video could not be played.{" "}
              <a
                href={record.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Open original video
              </a>
            </>
          ) : (
            "No playable video URL is available."
          )}
        </p>
      </div>
    );
  }
  return (
    <video
      src={record.videoUrl}
      controls
      playsInline
      preload="metadata"
      poster={record.thumbnailUrl || undefined}
      onError={() => setFailed(true)}
      aria-label={`Video player for ${record.title}`}
      className="aspect-video w-full rounded-lg bg-slate-950 object-contain"
    />
  );
}

function ModerationDialog({
  dialog,
  onClose,
  onApprove,
  onReject,
  onRemove,
  busy,
  error,
  rejectReason,
  onRejectReasonChange,
}) {
  if (!dialog) return null;

  const { kind, record } = dialog;
  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      disabled={busy}
      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      Hủy
    </button>
  );
  const primaryButton = (label, onClick, tone = "green", type = "button") => (
    <button
      type={type}
      disabled={busy}
      onClick={type === "submit" ? undefined : onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${tone === "red" ? "bg-red-600 hover:bg-red-700" : "bg-chaybook-primary hover:bg-chaybook-hover"}`}
    >
      {busy ? "Đang lưu…" : label}
    </button>
  );

  if (kind === "guidelines") {
    return (
      <ModalShell
        title="Hướng dẫn kiểm duyệt"
        icon={BookOpen}
        onClose={onClose}
        footer={closeButton}
      >
        <p className="mb-4 text-sm leading-6 text-slate-600">
          Hướng dẫn minh họa cho giao diện này.
        </p>
        <ul className="space-y-3">
          {GUIDELINES.map((guideline) => (
            <li
              key={guideline}
              className="flex gap-3 text-sm leading-6 text-slate-700"
            >
              <Check
                aria-hidden="true"
                size={17}
                className="mt-1 shrink-0 text-emerald-700"
              />
              <span>{guideline}</span>
            </li>
          ))}
        </ul>
      </ModalShell>
    );
  }

  if (kind === "rules") {
    return (
      <ModalShell
        title="Quy tắc lọc tự động"
        icon={ListFilter}
        onClose={onClose}
        footer={closeButton}
      >
        <p className="mb-4 text-sm leading-6 text-slate-600">
          Các quy tắc dưới đây chỉ mang tính minh họa và không thực hiện kiểm
          duyệt tự động.
        </p>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
          {FILTER_RULES.map((rule) => (
            <div key={rule.name} className="flex gap-3 p-3.5">
              <Sparkles
                aria-hidden="true"
                size={16}
                className="mt-0.5 shrink-0 text-emerald-700"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {rule.name}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  {rule.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ModalShell>
    );
  }

  if (kind === "approve") {
    return (
      <ModalShell
        title="Duyệt bài gửi này?"
        icon={ShieldCheck}
        onClose={onClose}
        footer={
          <>
            {closeButton}
            {primaryButton("Xác nhận duyệt", onApprove)}
          </>
        }
      >
        <ContentSummary record={record} />
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </ModalShell>
    );
  }

  if (kind === "reject") {
    return (
      <ModalShell
        title="Từ chối bài gửi"
        icon={CircleAlert}
        onClose={onClose}
      >
        <p className="mb-4 text-sm leading-6 text-slate-600">
          Nhập lý do để lưu cùng quyết định kiểm duyệt này.
        </p>
        <ContentSummary record={record} />
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">
            Lý do từ chối
          </span>
          <textarea
            value={rejectReason}
            onChange={(event) => onRejectReasonChange(event.target.value)}
            disabled={busy}
            rows={4}
            required
            aria-invalid={Boolean(error && !rejectReason.trim())}
            className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-slate-50"
            placeholder="Giải thích lý do từ chối bài gửi này..."
          />
          {error && (
            <span role="alert" className="mt-1.5 block text-sm text-red-700">
              {error}
            </span>
          )}
        </label>
        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          {closeButton}
          {primaryButton("Xác nhận từ chối", onReject, "red")}
        </div>
      </ModalShell>
    );
  }

  if (kind === "detail") {
    const mediaType = record.type === "VIDEO" ? "Video" : "Post";

    return (
      <ModalShell
        title={`Chi tiết ${record.type === "VIDEO" ? "video" : "bài viết"}`}
        icon={record.type === "VIDEO" ? Video : FileImage}
        onClose={onClose}
        width="max-w-xl"
      >
        {record.type === "VIDEO" ? (
          <VideoPreview key={`${record.type}-${record.id}`} record={record} />
        ) : record.thumbnailUrl ? (
          <ContentThumbnail record={record} large />
        ) : (
          <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
            Bài gửi này không có nội dung đa phương tiện.
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-slate-900">{record.title}</p>
            <p className="mt-1 text-sm text-slate-600">bởi @{record.creator}</p>
          </div>
          <StatusBadge status={record.status} />
        </div>
        <AdminRequestState loading={dialog.loading} error={error} />
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {record.description}
        </p>
        <section
          className="mt-5 rounded-xl border border-slate-100 p-4"
          aria-label="Kết quả kiểm duyệt của AI"
        >
          <h3 className="mb-3 text-sm font-bold text-slate-900">
            Kiểm duyệt bằng AI
          </h3>
          <AIReview record={record} />
        </section>
        {record.status === "REJECTED" && record.adminReason && (
          <div className="mt-4">
            <AdminRejectionReason record={record} />
          </div>
        )}
        <dl className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-slate-500">Ngày gửi</dt>
            <dd className="mt-1 font-semibold text-slate-800">
              {record.submittedDate} · {record.submittedTime} ICT
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Loại nội dung</dt>
            <dd className="mt-1 font-semibold text-slate-800">{mediaType}</dd>
          </div>
        </dl>
      </ModalShell>
    );
  }

  if (kind === "reason") {
    return (
      <ModalShell
        title="Lý do từ chối"
        icon={Info}
        onClose={onClose}
        footer={closeButton}
      >
        <ContentSummary record={record} />
        <div className="mt-4">
          <AdminRejectionReason record={record} />
        </div>
      </ModalShell>
    );
  }

  if (kind === "remove") {
    return (
      <ModalShell
        title="Gỡ nội dung này?"
        icon={Trash2}
        onClose={onClose}
        footer={
          <>
            {closeButton}
            {primaryButton("Gỡ bài gửi", onRemove, "red")}
          </>
        }
      >
        <p className="mb-4 text-sm leading-6 text-slate-600">
          The item will be removed from the moderation queue and public feed.
        </p>
        <ContentSummary record={record} />
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </ModalShell>
    );
  }

  return null;
}

function ActionButton({ children, Icon, tone = "neutral", onClick, label }) {
  const colors = {
    green: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
    red: "bg-red-100 text-red-700 hover:bg-red-200",
    neutral: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${colors}`}
    >
      <Icon aria-hidden="true" size={12} />
      {children}
    </button>
  );
}

function ModerationRow({ record, onOpenDialog }) {
  const TypeIcon = record.type === "VIDEO" ? CirclePlay : FileImage;
  const typeLabel = record.type === "VIDEO" ? "Video" : "Post";

  return (
    <tr className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
      <td className="whitespace-nowrap px-3 py-3.5 text-xs font-bold text-emerald-800 sm:px-4">
        #{String(record.id).padStart(4, "0")}
      </td>
      <td className="whitespace-nowrap px-2 py-3.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
          <TypeIcon aria-hidden="true" size={12} />
          {typeLabel}
        </span>
      </td>
      <td className="max-w-[340px] px-2 py-3.5 sm:px-3">
        <div className="flex min-w-[235px] items-center gap-2.5">
          <ContentThumbnail
            record={record}
            onClick={() => onOpenDialog("detail", record)}
          />
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-xs font-semibold text-slate-900">
              <span className="truncate">{record.title}</span>
              <a
                href={`#post-${record.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  onOpenDialog("detail", record);
                }}
                aria-label={`View ${record.title}`}
                className="shrink-0 text-slate-400 hover:text-emerald-700"
              >
                <Eye aria-hidden="true" size={12} />
              </a>
            </p>
            <p className="truncate text-[10px] leading-4 text-slate-500">
              Creator: @{record.creator} <span aria-hidden="true">·</span>{" "}
              {record.description}
            </p>
            {record.status === "REJECTED" && record.adminReason && (
              <p
                className="mt-1 truncate text-[10px] text-red-700"
                title={record.adminReason}
              >
                Admin reason: {record.adminReason}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="max-w-[220px] px-2 py-3.5">
        <AIReview record={record} compact />
      </td>
      <td className="whitespace-nowrap px-2 py-3.5 text-[10px] text-slate-500 sm:px-3">
        <span className="block text-xs text-slate-600">
          {record.submittedDate}
        </span>
        <span>{record.submittedTime} ICT</span>
      </td>
      <td className="whitespace-nowrap px-2 py-3.5">
        <StatusBadge status={record.status} />
      </td>
      <td className="px-2 py-3.5 sm:px-3">
        <div className="flex min-w-[172px] flex-wrap items-center gap-1">
          {record.status === "PENDING" && (
            <>
              <ActionButton
                Icon={Check}
                tone="green"
                label={`Approve ${record.title}`}
                onClick={() => onOpenDialog("approve", record)}
              >
                Approve
              </ActionButton>
              <ActionButton
                Icon={X}
                tone="red"
                label={`Reject ${record.title}`}
                onClick={() => onOpenDialog("reject", record)}
              >
                Reject
              </ActionButton>
            </>
          )}
          {record.status === "APPROVED" && (
            <>
              <ActionButton
                Icon={Eye}
                label={`View ${record.title}`}
                onClick={() => onOpenDialog("detail", record)}
              >
                View
              </ActionButton>
              <ActionButton
                Icon={X}
                tone="red"
                label={`Reject ${record.title}`}
                onClick={() => onOpenDialog("reject", record)}
              >
                Reject
              </ActionButton>
              <ActionButton
                Icon={Trash2}
                tone="red"
                label={`Remove ${record.title}`}
                onClick={() => onOpenDialog("remove", record)}
              >
                Remove
              </ActionButton>
            </>
          )}
          {record.status === "REJECTED" && (
            <>
              <ActionButton
                Icon={Eye}
                label={`View ${record.title}`}
                onClick={() => onOpenDialog("detail", record)}
              >
                View
              </ActionButton>
              <ActionButton
                Icon={Check}
                tone="green"
                label={`Approve ${record.title}`}
                onClick={() => onOpenDialog("approve", record)}
              >
                Approve
              </ActionButton>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function AdminPostVideoPage() {
  const [contentType, setContentType] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(
    (signal) =>
      getAdminSubmissions({
        type: contentType,
        status: statusFilter,
        q: searchQuery.trim(),
        page: currentPage - 1,
        size: PAGE_SIZE,
        signal,
      }).then((data) => {
        if (!signal.aborted && currentPage > Math.max(1, data.totalPages)) {
          setCurrentPage(Math.max(1, data.totalPages));
        }
        return data;
      }),
    [contentType, statusFilter, searchQuery, currentPage],
  );
  const resource = useAdminResource(load);
  const loadStatistics = useCallback(
    (signal) => getAdminSubmissionStatistics({ signal }),
    [],
  );
  const statistics = useAdminResource(loadStatistics);
  const detailKind = dialog?.kind;
  const detailType = dialog?.record?.type;
  const detailId = dialog?.record?.id;

  useEffect(() => {
    if (detailKind !== "detail") return;
    const controller = new AbortController();
    getAdminSubmission(detailType, detailId, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setDialog({ kind: "detail", record: toRecord(data), loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setActionError(error.message);
          setDialog((current) => ({ ...current, loading: false }));
        }
      });
    return () => controller.abort();
  }, [detailKind, detailType, detailId]);

  useEffect(() => {
    if (!dialog) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) setDialog(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialog, busy]);

  const counts = {
    total: statistics.data?.totalSubmission,
    pending: statistics.data?.pendingModeration,
    approved: statistics.data?.approvedLive,
    rejected: statistics.data?.rejectedEntries,
  };

  const statsValues = counts;
  const totalElements = resource.data?.totalElements ?? 0;
  const totalPages = Math.max(1, resource.data?.totalPages ?? 0);
  const page = Math.min(currentPage, totalPages);
  const visibleRecords = (resource.data?.items ?? []).map(toRecord);
  const pageNumbers = getPageNumbers(totalPages, page);
  const firstItem =
    visibleRecords.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem =
    visibleRecords.length === 0
      ? 0
      : (page - 1) * PAGE_SIZE + visibleRecords.length;
  const statusDescription =
    statusFilter === "ALL"
      ? "matching items"
      : `${statusFilter.toLowerCase()} moderation items`;

  const setFiltersAndResetPage = (update) => {
    update();
    setCurrentPage(1);
  };

  const openDialog = (kind, record = null) => {
    if (busy) return;
    setActionError("");
    setRejectReason("");
    setNotice("");
    setDialog({ kind, record, loading: kind === "detail" });
  };

  const closeDialog = () => {
    if (busy) return;
    setDialog(null);
    setActionError("");
  };

  const updateSelectedStatus = async (status, reason = null) => {
    if (!dialog?.record || busy) return;
    const normalizedReason = status === "REJECTED" ? reason?.trim() : null;
    if (status === "REJECTED" && !normalizedReason) {
      setActionError("Please enter a rejection reason.");
      return;
    }
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      await updateAdminSubmissionStatus(
        dialog.record.type,
        dialog.record.id,
        status,
        normalizedReason,
      );
      setDialog(null);
      setNotice(
        status === "APPROVED"
          ? "Submission approved successfully."
          : status === "REJECTED"
            ? "Submission rejected successfully."
            : "Submission removed successfully.",
      );
      resource.retry();
      statistics.retry();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = () => {
    resource.retry();
    statistics.retry();
    closeDialog();
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 sm:space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-chaybook-primary">
            <CirclePlay aria-hidden="true" size={22} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Manage Post &amp; Video
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Live Review
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          <button
            type="button"
            onClick={() => openDialog("guidelines")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <BookOpen aria-hidden="true" size={15} />
            Guidelines
          </button>
          <button
            type="button"
            onClick={() => openDialog("rules")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-chaybook-primary px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-chaybook-hover"
          >
            <ListFilter aria-hidden="true" size={15} />
            Auto-Filter Rules
          </button>
        </div>
      </header>
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-emerald-800"
        >
          {notice}
        </p>
      )}
      {!dialog && <AdminRequestState error={actionError} />}
      <AdminRequestState {...statistics} onRetry={statistics.retry} />

      <section
        aria-label="Thống kê bài gửi"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {STAT_CARDS.map((card) => (
          <StatCard key={card.key} card={card} value={statsValues[card.key]} />
        ))}
      </section>

      <section
        className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"
        aria-label="Hàng chờ kiểm duyệt bài viết và video"
      >
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 sm:p-4 xl:flex-row xl:items-center">
          <div
            role="tablist"
            aria-label="Lọc theo loại nội dung"
            className="flex w-fit max-w-full shrink-0 items-center rounded-lg bg-slate-100 p-1"
          >
            {[
              { key: "ALL", label: "Tất cả" },
              { key: "POST", label: "Bài viết" },
              { key: "VIDEO", label: "Video" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={contentType === tab.key}
                onClick={() =>
                  setFiltersAndResetPage(() => setContentType(tab.key))
                }
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold transition ${contentType === tab.key ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                {tab.label}
                <span
                  className={`text-[10px] ${contentType === tab.key ? "text-slate-500" : "text-slate-400"}`}
                >
                  {tab.count == null ? "" : formatNumber(tab.count)}
                </span>
              </button>
            ))}
          </div>

          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Tìm bài viết, người đăng hoặc hashtag</span>
            <Search
              aria-hidden="true"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setFiltersAndResetPage(() => setSearchQuery(event.target.value))
              }
              placeholder="Tìm bài viết, người đăng, #hashtag..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-chaybook-primary focus:bg-white focus:ring-2 focus:ring-emerald-700/10"
            />
          </label>

          <label className="sr-only" htmlFor="post-video-status-filter">
            Lọc theo trạng thái
          </label>
          <select
            id="post-video-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setFiltersAndResetPage(() => setStatusFilter(event.target.value))
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 outline-none focus:border-chaybook-primary focus:ring-2 focus:ring-emerald-700/10 sm:w-auto"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={resource.loading || busy}
            aria-label="Làm mới danh sách bài gửi"
            title="Làm mới danh sách bài gửi"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-white hover:text-emerald-800 sm:self-auto"
          >
            <RefreshCw aria-hidden="true" size={15} />
          </button>
        </div>

        <AdminRequestState {...resource} onRetry={resource.retry} />
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left">
            <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="whitespace-nowrap px-3 py-3 sm:px-4">
                  Mã bài viết
                </th>
                <th scope="col" className="px-2 py-3">
                  Loại
                </th>
                <th scope="col" className="px-2 py-3 sm:px-3">
                  Nội dung &amp; người đăng
                </th>
                <th scope="col" className="px-2 py-3">
                  Đánh giá của AI
                </th>
                <th scope="col" className="whitespace-nowrap px-2 py-3 sm:px-3">
                  Ngày gửi
                </th>
                <th scope="col" className="px-2 py-3">
                  Trạng thái
                </th>
                <th scope="col" className="px-2 py-3 sm:px-3">
                  Thao tác kiểm duyệt
                </th>
              </tr>
            </thead>
            <tbody>
              {resource.loading ||
              resource.error ? null : visibleRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <Search
                        aria-hidden="true"
                        size={23}
                        className="text-slate-300"
                      />
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        Không tìm thấy bài gửi
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Hãy thử loại nội dung, trạng thái hoặc từ khóa khác.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleRecords.map((record) => (
                  <ModerationRow
                    key={`${record.type}-${record.id}`}
                    record={record}
                    onOpenDialog={openDialog}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-100 px-3 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <p className="text-[11px] text-slate-500" aria-live="polite">
            Hiển thị {formatNumber(firstItem)}–{formatNumber(lastItem)} /{" "}
            {formatNumber(totalElements)} {statusDescription}
          </p>
          <nav
            aria-label="Các trang kiểm duyệt"
            className="flex items-center gap-1 self-end sm:self-auto"
          >
            <button
              type="button"
              onClick={() => setCurrentPage(page - 1)}
              disabled={page <= 1 || resource.loading}
              aria-label="Trang trước"
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <ChevronLeft aria-hidden="true" size={16} />
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                aria-current={page === pageNumber ? "page" : undefined}
                aria-label={`Trang ${pageNumber}`}
                className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold transition ${page === pageNumber ? "bg-chaybook-primary text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage(page + 1)}
              disabled={page >= totalPages || resource.loading}
              aria-label="Trang sau"
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <ChevronRight aria-hidden="true" size={16} />
            </button>
          </nav>
        </footer>
      </section>

      <ModerationDialog
        dialog={dialog}
        onClose={closeDialog}
        onApprove={() => updateSelectedStatus("APPROVED")}
        onReject={() => updateSelectedStatus("REJECTED", rejectReason)}
        onRemove={() => updateSelectedStatus("REMOVED")}
        busy={busy}
        error={actionError}
        rejectReason={rejectReason}
        onRejectReasonChange={(value) => {
          setRejectReason(value);
          if (actionError) setActionError("");
        }}
      />
    </div>
  );
}

export default AdminPostVideoPage;
