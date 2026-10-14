import { useEffect, useMemo, useState } from "react";
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

import { createAdminPostVideoMockData } from "../../data/adminPostVideoMock";

const PAGE_SIZE = 7;
const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

const STAT_CARDS = [
  {
    key: "total",
    title: "Total Submissions",
    description: "vs past 7 days review load",
    growth: "+12%",
    growthTone: "green",
    Icon: FileImage,
    tone: "neutral",
  },
  {
    key: "pending",
    title: "Pending Moderation",
    description: "Average response time: 24m",
    growth: "+8%",
    growthTone: "neutral",
    Icon: Clock3,
    tone: "neutral",
  },
  {
    key: "approved",
    title: "Approved & Live",
    description: "Published directly to feed",
    growth: "+15%",
    growthTone: "green",
    Icon: BadgeCheck,
    tone: "green",
  },
  {
    key: "rejected",
    title: "Rejected Entries",
    description: "Feedback logs dispatched to users",
    growth: "-2%",
    growthTone: "red",
    Icon: Ban,
    tone: "red",
  },
];

const GUIDELINES = [
  "Review that the post or video relates to plant-based food or the ChayBook community.",
  "Check that images, music, and other media appear appropriate to share.",
  "Give a clear reason when declining a submission so its creator can understand what to revise.",
  "These examples are for this UI demonstration and are not official ChayBook policies.",
];

const FILTER_RULES = [
  { name: "Repeated links", detail: "Flag posts that contain repeated external links." },
  { name: "Sensitive words", detail: "Send configured words to a moderator for review." },
  { name: "Duplicate submissions", detail: "Highlight submissions with a matching title and creator." },
  { name: "Media review", detail: "Keep video submissions in the review queue until approved." },
];

function formatNumber(value) {
  return NUMBER_FORMAT.format(value);
}

function filterRecords(records, contentType, statusFilter, searchQuery) {
  const query = searchQuery.trim().toLocaleLowerCase();

  return records.filter((record) => {
    const matchesType = contentType === "ALL" || record.type === contentType;
    const matchesStatus = statusFilter === "ALL" || record.status === statusFilter;
    const searchableText = [
      record.id,
      String(record.id).padStart(4, "0"),
      record.title,
      record.creator,
      record.description,
    ]
      .join(" ")
      .toLocaleLowerCase();

    return matchesType && matchesStatus && searchableText.includes(query);
  });
}

function getPageNumbers(totalPages, currentPage) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => firstPage + index);
}

function ContentThumbnail({ record, large = false, onClick }) {
  const fallbackEmojis = ["🥗", "🍲", "🥑", "🥕"];
  const dimensions = large ? "h-56 w-full sm:h-64" : "h-10 w-10";
  const thumbnail = (
    <span className={`relative block ${dimensions} shrink-0 overflow-hidden rounded-lg bg-emerald-50`}>
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center text-2xl"
      >
        {fallbackEmojis[(record.id - 1) % fallbackEmojis.length]}
      </span>
      <img
        src={large ? record.thumbnailUrl.replace("w=120", "w=1200") : record.thumbnailUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.hidden = true;
        }}
      />
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
      aria-label={`View ${record.type.toLowerCase()} ${record.title}`}
      className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
    >
      {thumbnail}
    </button>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    PENDING: {
      label: "Pending",
      Icon: Clock3,
      className: "bg-slate-100 text-slate-600",
    },
    APPROVED: {
      label: "Approved",
      Icon: CircleCheck,
      className: "bg-emerald-100 text-emerald-800",
    },
    REJECTED: {
      label: "Rejected",
      Icon: CircleAlert,
      className: "bg-red-100 text-red-700",
    },
  };
  const config = statusConfig[status] || statusConfig.PENDING;
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
  const valueTone = card.tone === "green" ? "text-emerald-700" : card.tone === "red" ? "text-red-700" : "text-slate-900";
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
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconTone}`}>
          <Icon aria-hidden="true" size={17} />
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className={`text-2xl font-bold tracking-tight sm:text-3xl ${valueTone}`}>
          {formatNumber(value)}
        </p>
        <span className={`mb-1 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${growthTone}`}>
          {card.growth}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] leading-4 text-slate-500">{card.description}</p>
    </section>
  );
}

function ModalShell({ title, icon: Icon, onClose, children, footer, width = "max-w-lg" }) {
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
            <h2 id="admin-post-video-dialog-title" className="text-base font-bold text-slate-900">
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
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
        <p className="truncate text-sm font-semibold text-slate-900">{record.title}</p>
        <p className="truncate text-xs text-slate-500">
          @{record.creator} <span aria-hidden="true">·</span> {record.description}
        </p>
      </div>
    </div>
  );
}

function ModerationDialog({
  dialog,
  onClose,
  onApprove,
  onReject,
  onRemove,
  rejectionDraft,
  setRejectionDraft,
  rejectionError,
  setRejectionError,
}) {
  if (!dialog) return null;

  const { kind, record } = dialog;
  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      Cancel
    </button>
  );
  const primaryButton = (label, onClick, tone = "green", type = "button") => (
    <button
      type={type}
      onClick={type === "submit" ? undefined : onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${tone === "red" ? "bg-red-600 hover:bg-red-700" : "bg-chaybook-primary hover:bg-chaybook-hover"}`}
    >
      {label}
    </button>
  );

  if (kind === "guidelines") {
    return (
      <ModalShell
        title="Moderation Guidelines"
        icon={BookOpen}
        onClose={onClose}
        footer={closeButton}
      >
        <p className="mb-4 text-sm leading-6 text-slate-600">
          Example guidance for this local UI demonstration.
        </p>
        <ul className="space-y-3">
          {GUIDELINES.map((guideline) => (
            <li key={guideline} className="flex gap-3 text-sm leading-6 text-slate-700">
              <Check aria-hidden="true" size={17} className="mt-1 shrink-0 text-emerald-700" />
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
        title="Auto-Filter Rules"
        icon={ListFilter}
        onClose={onClose}
        footer={closeButton}
      >
        <p className="mb-4 text-sm leading-6 text-slate-600">
          Example rules shown for demonstration. They do not run automatic moderation.
        </p>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
          {FILTER_RULES.map((rule) => (
            <div key={rule.name} className="flex gap-3 p-3.5">
              <Sparkles aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-emerald-700" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{rule.name}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{rule.detail}</p>
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
        title="Approve this submission?"
        icon={ShieldCheck}
        onClose={onClose}
        footer={
          <>
            {closeButton}
            {primaryButton("Confirm approval", onApprove)}
          </>
        }
      >
        <ContentSummary record={record} />
      </ModalShell>
    );
  }

  if (kind === "reject") {
    return (
      <ModalShell title="Reject submission" icon={CircleAlert} onClose={onClose}>
        <p className="mb-4 text-sm leading-6 text-slate-600">
          Add a reason for the creator. This change is stored only in local page state.
        </p>
        <ContentSummary record={record} />
        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            onReject();
          }}
        >
          <label htmlFor="rejection-reason" className="block text-sm font-semibold text-slate-700">
            Rejection reason <span className="text-red-600">*</span>
          </label>
          <textarea
            id="rejection-reason"
            rows={3}
            value={rejectionDraft}
            onChange={(event) => {
              setRejectionDraft(event.target.value);
              if (event.target.value.trim()) setRejectionError(false);
            }}
            aria-invalid={rejectionError}
            aria-required="true"
            aria-describedby={rejectionError ? "rejection-error" : undefined}
            className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-chaybook-primary focus:ring-2 focus:ring-emerald-700/10"
            placeholder="Explain what should be changed..."
          />
          {rejectionError && (
            <p id="rejection-error" role="alert" className="text-xs font-medium text-red-700">
              Enter a rejection reason before confirming.
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            {closeButton}
            {primaryButton("Confirm rejection", undefined, "red", "submit")}
          </div>
        </form>
      </ModalShell>
    );
  }

  if (kind === "detail") {
    const mediaType = record.type === "VIDEO" ? "Video" : "Post";

    return (
      <ModalShell title={`${mediaType} details`} icon={record.type === "VIDEO" ? Video : FileImage} onClose={onClose} width="max-w-xl">
        {record.type === "VIDEO" && record.videoUrl ? (
          <video
            key={record.id}
            controls
            playsInline
            preload="metadata"
            poster={record.thumbnailUrl}
            aria-label={`Video player for ${record.title}`}
            className="aspect-video w-full rounded-lg bg-slate-950 object-contain"
          >
            <source src={record.videoUrl} type="video/mp4" />
            Your browser does not support HTML video.
          </video>
        ) : (
          <ContentThumbnail record={record} large />
        )}
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-slate-900">{record.title}</p>
            <p className="mt-1 text-sm text-slate-600">by @{record.creator}</p>
          </div>
          <StatusBadge status={record.status} />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-700">{record.description}</p>
        <dl className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-slate-500">Submitted</dt>
            <dd className="mt-1 font-semibold text-slate-800">{record.submittedDate} · {record.submittedTime} ICT</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Content type</dt>
            <dd className="mt-1 font-semibold text-slate-800">{mediaType}</dd>
          </div>
        </dl>
      </ModalShell>
    );
  }

  if (kind === "reason") {
    return (
      <ModalShell title="Rejection reason" icon={Info} onClose={onClose} footer={closeButton}>
        <ContentSummary record={record} />
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Feedback to creator</p>
          <p className="mt-2 text-sm leading-6 text-red-900">
            {record.rejectionReason || "No reason was saved for this item."}
          </p>
        </div>
      </ModalShell>
    );
  }

  if (kind === "remove") {
    return (
      <ModalShell
        title="Remove this item?"
        icon={Trash2}
        onClose={onClose}
        footer={
          <>
            {closeButton}
            {primaryButton("Remove from mock data", onRemove, "red")}
          </>
        }
      >
        <p className="mb-4 text-sm leading-6 text-slate-600">
          The item will be removed from this page's local dataset only.
        </p>
        <ContentSummary record={record} />
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
              Creator: @{record.creator} <span aria-hidden="true">·</span> {record.description}
            </p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-2 py-3.5 text-[10px] text-slate-500 sm:px-3">
        <span className="block text-xs text-slate-600">{record.submittedDate}</span>
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
                label={`Remove ${record.title} from mock data`}
                onClick={() => onOpenDialog("remove", record)}
              >
                Remove
              </ActionButton>
            </>
          )}
          {record.status === "REJECTED" && (
            <>
              <ActionButton
                Icon={Info}
                label={`View rejection reason for ${record.title}`}
                onClick={() => onOpenDialog("reason", record)}
              >
                Reason
              </ActionButton>
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
  const [records, setRecords] = useState(createAdminPostVideoMockData);
  const [contentType, setContentType] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [rejectionDraft, setRejectionDraft] = useState("");
  const [rejectionError, setRejectionError] = useState(false);

  useEffect(() => {
    if (!dialog) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setDialog(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialog]);

  const counts = useMemo(
    () =>
      records.reduce(
        (totals, record) => {
          totals.total += 1;
          if (record.type === "POST") totals.posts += 1;
          if (record.type === "VIDEO") totals.videos += 1;
          if (record.status === "PENDING") totals.pending += 1;
          if (record.status === "APPROVED") totals.approved += 1;
          if (record.status === "REJECTED") totals.rejected += 1;
          return totals;
        },
        { total: 0, posts: 0, videos: 0, pending: 0, approved: 0, rejected: 0 },
      ),
    [records],
  );

  const statsValues = {
    total: counts.total,
    pending: counts.pending,
    approved: counts.approved,
    rejected: counts.rejected,
  };

  const filteredRecords = useMemo(
    () => filterRecords(records, contentType, statusFilter, searchQuery),
    [records, contentType, statusFilter, searchQuery],
  );
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const visibleRecords = filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageNumbers = getPageNumbers(totalPages, page);
  const firstItem = filteredRecords.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, filteredRecords.length);
  const statusDescription =
    statusFilter === "ALL"
      ? "matching items"
      : `${statusFilter.toLowerCase()} moderation items`;

  const setFiltersAndResetPage = (update) => {
    update();
    setCurrentPage(1);
  };

  const openDialog = (kind, record = null) => {
    setRejectionDraft("");
    setRejectionError(false);
    setDialog({ kind, record });
  };

  const closeDialog = () => {
    setDialog(null);
    setRejectionDraft("");
    setRejectionError(false);
  };

  const commitRecords = (nextRecords) => {
    setRecords(nextRecords);
    const nextCount = filterRecords(
      nextRecords,
      contentType,
      statusFilter,
      searchQuery,
    ).length;
    const nextTotalPages = Math.max(1, Math.ceil(nextCount / PAGE_SIZE));
    setCurrentPage((current) => Math.min(current, nextTotalPages));
  };

  const updateSelectedStatus = (status, rejectionReason = "") => {
    if (!dialog?.record) return;
    const nextRecords = records.map((record) =>
      record.id === dialog.record.id
        ? { ...record, status, rejectionReason }
        : record,
    );
    commitRecords(nextRecords);
    closeDialog();
  };

  const handleReject = () => {
    const reason = rejectionDraft.trim();
    if (!reason) {
      setRejectionError(true);
      return;
    }
    updateSelectedStatus("REJECTED", reason);
  };

  const handleRemove = () => {
    if (!dialog?.record) return;
    commitRecords(records.filter((record) => record.id !== dialog.record.id));
    closeDialog();
  };

  const handleRefresh = () => {
    setRecords(createAdminPostVideoMockData());
    setContentType("ALL");
    setStatusFilter("PENDING");
    setSearchQuery("");
    setCurrentPage(1);
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

      <section aria-label="Submission statistics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.key} card={card} value={statsValues[card.key]} />
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm" aria-label="Post and video moderation queue">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 sm:p-4 xl:flex-row xl:items-center">
          <div role="tablist" aria-label="Filter by content type" className="flex w-fit max-w-full shrink-0 items-center rounded-lg bg-slate-100 p-1">
            {[
              { key: "ALL", label: "All", count: counts.total },
              { key: "POST", label: "Post", count: counts.posts },
              { key: "VIDEO", label: "Video", count: counts.videos },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={contentType === tab.key}
                onClick={() => setFiltersAndResetPage(() => setContentType(tab.key))}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold transition ${contentType === tab.key ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                {tab.label}
                <span className={`text-[10px] ${contentType === tab.key ? "text-slate-500" : "text-slate-400"}`}>
                  {formatNumber(tab.count)}
                </span>
              </button>
            ))}
          </div>

          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search posts, creators, or hashtags</span>
            <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setFiltersAndResetPage(() => setSearchQuery(event.target.value))}
              placeholder="Search posts, creators, #hashtags..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-chaybook-primary focus:bg-white focus:ring-2 focus:ring-emerald-700/10"
            />
          </label>

          <label className="sr-only" htmlFor="post-video-status-filter">Filter by status</label>
          <select
            id="post-video-status-filter"
            value={statusFilter}
            onChange={(event) => setFiltersAndResetPage(() => setStatusFilter(event.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 outline-none focus:border-chaybook-primary focus:ring-2 focus:ring-emerald-700/10 sm:w-auto"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending ({counts.pending})</option>
            <option value="APPROVED">Approved ({counts.approved})</option>
            <option value="REJECTED">Rejected ({counts.rejected})</option>
          </select>
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Refresh mock submissions and reset filters"
            title="Refresh mock data"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-white hover:text-emerald-800 sm:self-auto"
          >
            <RefreshCw aria-hidden="true" size={15} />
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="whitespace-nowrap px-3 py-3 sm:px-4">Post ID</th>
                <th scope="col" className="px-2 py-3">Type</th>
                <th scope="col" className="px-2 py-3 sm:px-3">Content &amp; Creator</th>
                <th scope="col" className="whitespace-nowrap px-2 py-3 sm:px-3">Submitted</th>
                <th scope="col" className="px-2 py-3">Status</th>
                <th scope="col" className="px-2 py-3 sm:px-3">Moderation Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <Search aria-hidden="true" size={23} className="text-slate-300" />
                      <p className="mt-2 text-sm font-semibold text-slate-700">No submissions found</p>
                      <p className="mt-1 text-xs text-slate-500">Try another content type, status, or search term.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleRecords.map((record) => (
                  <ModerationRow key={record.id} record={record} onOpenDialog={openDialog} />
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-100 px-3 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <p className="text-[11px] text-slate-500" aria-live="polite">
            Showing {formatNumber(firstItem)} to {formatNumber(lastItem)} of {formatNumber(filteredRecords.length)} {statusDescription}
          </p>
          <nav aria-label="Moderation pages" className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setCurrentPage(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
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
                aria-label={`Page ${pageNumber}`}
                className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold transition ${page === pageNumber ? "bg-chaybook-primary text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next page"
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
        onReject={handleReject}
        onRemove={handleRemove}
        rejectionDraft={rejectionDraft}
        setRejectionDraft={setRejectionDraft}
        rejectionError={rejectionError}
        setRejectionError={setRejectionError}
      />
    </div>
  );
}

export default AdminPostVideoPage;
