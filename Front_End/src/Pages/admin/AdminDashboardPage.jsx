import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Bookmark,
  CalendarDays,
  FileText,
  Heart,
  ImageOff,
  MessageCircle,
  MessageSquareText,
  RefreshCw,
  Users,
} from "lucide-react";

import { getAdminUserStatistics } from "../../services/adminUserServices";
import { getPosts } from "../../services/postServices";
import {
  getAdminAiMessageCount,
  getAdminArticlePage,
  getAdminInteractionChart,
  getAdminInteractionRate,
  getAdminTopContributors,
} from "../../services/adminDashboardServices";
import API_BASE_URL from "../../services/app";

const API_ORIGIN = new URL(API_BASE_URL).origin;
const NUMBER_FORMAT = new Intl.NumberFormat("en-US");
const PERCENT_FORMAT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});
const CHART_WIDTH = 720;
const CHART_HEIGHT = 260;
const CHART_LEFT = 48;
const CHART_RIGHT = 12;
const CHART_TOP = 18;
const CHART_BOTTOM = 220;
const CHART_SERIES = [
  { key: "likeCount", label: "Likes", color: "#10b981" },
  { key: "bookmarkCount", label: "Bookmarks", color: "#6366f1" },
  { key: "commentCount", label: "Comments", color: "#f59e0b" },
];

const initialResources = {
  users: { status: "loading", data: null },
  posts: { status: "loading", data: null },
  articles: { status: "loading", data: null },
  interactionRate: { status: "loading", data: null },
  aiMessages: { status: "loading", data: null },
  chart: { status: "loading", data: null },
  contributors: { status: "loading", data: null },
};

function formatCount(value) {
  return NUMBER_FORMAT.format(value);
}

function formatPercent(value) {
  return PERCENT_FORMAT.format(value) + "%";
}

function formatChartDate(value, includeYear = false) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
}

function normalizeCount(value, label) {
  const count = Number(value);

  if (!Number.isFinite(count) || count < 0) {
    throw new TypeError("The " + label + " API returned an invalid count.");
  }

  return count;
}

function normalizePage(response, label) {
  if (!response || !Array.isArray(response.items)) {
    throw new TypeError("The " + label + " API returned an invalid page.");
  }

  return {
    count: normalizeCount(response.totalElements, label),
    items: response.items,
    empty: Number(response.totalElements) === 0,
  };
}

function normalizeInteractionRate(response) {
  const numerator = normalizeCount(
    response?.postsWithInteractions,
    "interaction rate",
  );
  const denominator = normalizeCount(
    response?.totalApprovedPosts,
    "interaction rate",
  );
  const ratePercent =
    response?.ratePercent === null ? null : Number(response?.ratePercent);

  if (
    numerator > denominator ||
    (denominator === 0 && ratePercent !== null) ||
    (denominator > 0 &&
      (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100))
  ) {
    throw new TypeError("The interaction rate API returned invalid totals.");
  }

  return {
    count: ratePercent,
    empty: denominator === 0,
    emptyValue: "—",
    emptyReason: "No approved posts are available to calculate a rate.",
    detail:
      formatCount(numerator) +
      " of " +
      formatCount(denominator) +
      " approved posts have at least one interaction.",
  };
}

function normalizeAiMessageCount(response) {
  const count = normalizeCount(response?.totalMessages, "AI messages");
  const includedSenders = Array.isArray(response?.includedSenders)
    ? response.includedSenders.join(" and ")
    : "";

  if (!includedSenders) {
    throw new TypeError("The AI message API did not define included senders.");
  }

  return {
    count,
    detail: "Includes saved " + includedSenders + " messages.",
  };
}

function normalizeInteractionChart(response, expectedDays) {
  if (
    response?.days !== expectedDays ||
    !Array.isArray(response?.items) ||
    response.items.length !== expectedDays
  ) {
    throw new TypeError("The interaction chart API returned an invalid range.");
  }

  const items = response.items.map((item) => {
    const date = typeof item?.date === "string" ? item.date : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new TypeError("The interaction chart API returned an invalid date.");
    }

    const likeCount = normalizeCount(item?.likeCount, "interaction chart");
    const bookmarkCount = normalizeCount(
      item?.bookmarkCount,
      "interaction chart",
    );
    const commentCount = normalizeCount(item?.commentCount, "interaction chart");
    const totalCount = normalizeCount(item?.totalCount, "interaction chart");

    if (totalCount !== likeCount + bookmarkCount + commentCount) {
      throw new TypeError("The interaction chart API returned invalid totals.");
    }

    return {
      date,
      likeCount,
      bookmarkCount,
      commentCount,
      totalCount,
    };
  });

  return {
    days: expectedDays,
    timezone: response.timezone || "Asia/Ho_Chi_Minh",
    items,
  };
}

function normalizeTopContributors(response) {
  if (!Array.isArray(response?.items)) {
    throw new TypeError("The top contributors API returned an invalid list.");
  }

  return {
    metric:
      response.metric ||
      "Number of currently approved posts by active USER accounts.",
    items: response.items.map((item) => ({
      rank: normalizeCount(item?.rank, "top contributors"),
      userId: normalizeCount(item?.userId, "top contributors"),
      displayName:
        typeof item?.displayName === "string" && item.displayName.trim()
          ? item.displayName.trim()
          : "ChayBook user",
      avatarUrl: item?.avatarUrl || null,
      contributionCount: normalizeCount(
        item?.contributionCount,
        "top contributors",
      ),
    })),
  };
}

function classifyRequestError(error) {
  return error?.status === 404 || error?.status === 501
    ? "unavailable"
    : "error";
}

function StatCard({
  title,
  Icon,
  resource,
  unavailableReason,
  detail,
  onRetry,
  valueFormatter = formatCount,
}) {
  const resourceStatus = resource?.status || "unavailable";
  const isEmpty = resourceStatus === "success" && resource.data?.empty === true;
  const displayStatus = isEmpty ? "empty" : resourceStatus;

  let value = "Unavailable";
  if (displayStatus === "loading") value = "";
  if (displayStatus === "error") value = "Could not load";
  if (displayStatus === "success" || displayStatus === "empty") {
    value =
      resource.data.count === null || resource.data.count === undefined
        ? resource.data.emptyValue || "—"
        : valueFormatter(resource.data.count);
  }

  let supportingText = resource?.data?.detail || detail;
  if (displayStatus === "empty") {
    supportingText =
      resource.data.emptyReason || "No records found yet.";
  }
  if (displayStatus === "unavailable") {
    supportingText = unavailableReason || "Statistics are not available yet.";
  }
  if (displayStatus === "error") {
    supportingText = "The request failed. Retry to load this statistic.";
  }

  return (
    <section
      aria-busy={displayStatus === "loading"}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">
            {title}
          </p>
          {displayStatus === "loading" ? (
            <div
              aria-label={"Loading " + title}
              className="mt-3 h-8 w-28 animate-pulse rounded-md bg-slate-100"
            />
          ) : (
            <p
              className={
                "mt-3 break-words text-2xl font-bold tracking-tight " +
                (displayStatus === "success" || displayStatus === "empty"
                  ? "text-slate-900"
                  : "text-slate-400")
              }
            >
              {value}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
          <Icon aria-hidden="true" size={19} />
        </span>
      </div>
      <div className="mt-3 flex min-h-10 items-start justify-between gap-2">
        <p className="text-xs leading-5 text-slate-500">{supportingText}</p>
        {displayStatus === "error" && (
          <button
            type="button"
            onClick={onRetry}
            aria-label={"Retry loading " + title}
            className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-700"
          >
            <RefreshCw aria-hidden="true" size={15} />
          </button>
        )}
      </div>
    </section>
  );
}

function SectionMessage({ Icon = Activity, title, children, action }) {
  return (
    <div
      role="status"
      className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-8 text-center"
    >
      <span className="mb-3 rounded-xl bg-white p-3 text-emerald-700 shadow-sm">
        <Icon aria-hidden="true" size={21} />
      </span>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500">
        {children}
      </p>
      {action}
    </div>
  );
}

function PostThumbnail({ imageUrl, title }) {
  const [failed, setFailed] = useState(false);
  let source = "";

  if (typeof imageUrl === "string" && imageUrl.trim()) {
    try {
      source = new URL(imageUrl.trim(), API_ORIGIN + "/").toString();
    } catch {
      source = "";
    }
  }

  if (!source || failed) {
    return (
      <div className="flex h-full min-h-24 w-full items-center justify-center bg-slate-100 text-slate-400">
        <ImageOff aria-hidden="true" size={21} />
        <span className="sr-only">No post image available</span>
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={title || "Community post"}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full min-h-24 w-full object-cover"
    />
  );
}

function getInitials(name) {
  const words = (name || "?").trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return (words[0] || "?").slice(0, 2).toUpperCase();
}

function AuthorAvatar({ name, avatarUrl }) {
  const [failed, setFailed] = useState(false);
  let source = "";

  if (typeof avatarUrl === "string" && avatarUrl.trim()) {
    try {
      source = new URL(avatarUrl.trim(), API_ORIGIN + "/").toString();
    } catch {
      source = "";
    }
  }

  if (!source || failed) {
    return (
      <span
        role="img"
        aria-label={name || "Unknown author"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800"
      >
        {getInitials(name)}
      </span>
    );
  }

  return (
    <img
      src={source}
      alt={name || "Post author"}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-8 w-8 shrink-0 rounded-full object-cover"
    />
  );
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatOptionalCount(value) {
  if (value === null || value === undefined || value === "") return null;
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? formatCount(count) : null;
}

function PostRow({ post }) {
  const title = post.title?.trim() || "Untitled post";
  const description = post.content?.trim();
  const likes = formatOptionalCount(post.likeCount);
  const comments = formatOptionalCount(post.commentCount);
  const bookmarks = formatOptionalCount(post.bookmarkCount);

  return (
    <article className="flex min-w-0 gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:border-emerald-100 hover:bg-emerald-50/30 sm:gap-4">
      <div className="h-24 w-28 shrink-0 overflow-hidden rounded-lg sm:w-32">
        <PostThumbnail imageUrl={post.imageUrl} title={title} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {post.categoryName && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              {post.categoryName}
            </span>
          )}
          <time
            dateTime={post.createdAt || undefined}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400"
          >
            <CalendarDays aria-hidden="true" size={12} />
            {formatDate(post.createdAt)}
          </time>
        </div>
        <h3 className="mt-2 line-clamp-2 break-words text-sm font-semibold leading-5 text-slate-900">
          {title}
        </h3>
        <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-500">
          {description || "No description available."}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <AuthorAvatar name={post.username} avatarUrl={post.avatarUrl} />
            <span className="max-w-32 truncate text-xs font-medium text-slate-700">
              {post.username || "Unknown author"}
            </span>
          </div>
          <div
            aria-label="Post interactions"
            className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500"
          >
            {likes !== null && (
              <span className="inline-flex items-center gap-1">
                <Heart aria-hidden="true" size={12} />
                {likes}
              </span>
            )}
            {comments !== null && (
              <span className="inline-flex items-center gap-1">
                <MessageCircle aria-hidden="true" size={12} />
                {comments}
              </span>
            )}
            {bookmarks !== null && (
              <span className="inline-flex items-center gap-1">
                <Bookmark aria-hidden="true" size={12} />
                {bookmarks}
              </span>
            )}
            {likes === null && comments === null && bookmarks === null && (
              <span>Interaction counts unavailable</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function PostSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex gap-4 rounded-xl border border-slate-100 p-3"
    >
      <div className="h-24 w-28 shrink-0 animate-pulse rounded-lg bg-slate-100 sm:w-32" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

function LatestPosts({ resource, onRetry }) {
  const sectionHeader = (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2
          id="latest-posts-title"
          className="text-base font-bold text-slate-900"
        >
          Latest Posts
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Latest approved posts returned by the community API.
        </p>
      </div>
      <Link
        to="/community"
        className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
      >
        View community
      </Link>
    </div>
  );

  return (
    <section
      aria-labelledby="latest-posts-title"
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      {sectionHeader}
      <div className="space-y-3">
        {resource.status === "loading" && (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        )}
        {resource.status === "error" && (
          <SectionMessage
            Icon={MessageSquareText}
            title="Posts could not be loaded"
            action={
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-emerald-50"
              >
                Retry
              </button>
            }
          >
            The posts request failed. Try refreshing the dashboard.
          </SectionMessage>
        )}
        {resource.status === "unavailable" && (
          <SectionMessage
            Icon={MessageSquareText}
            title="Posts are unavailable"
          >
            The community posts endpoint is not available right now.
          </SectionMessage>
        )}
        {resource.status === "success" && resource.data.items.length === 0 && (
          <SectionMessage
            Icon={MessageSquareText}
            title="No approved posts yet"
          >
            The API returned no posts to show.
          </SectionMessage>
        )}
        {resource.status === "success" &&
          resource.data.items.slice(0, 3).map((post) => (
            <PostRow key={post.postId} post={post} />
          ))}
      </div>
    </section>
  );
}

function InteractionChart({ resource, days, onDaysChange, onRetry }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const items = resource?.data?.items || [];
  const graphWidth = CHART_WIDTH - CHART_LEFT - CHART_RIGHT;
  const graphHeight = CHART_BOTTOM - CHART_TOP;
  const observedMax = items.reduce(
    (maximum, item) =>
      Math.max(
        maximum,
        item.likeCount,
        item.bookmarkCount,
        item.commentCount,
      ),
    0,
  );
  const chartMax = Math.max(4, Math.ceil(observedMax / 4) * 4);
  const chartX = (index) =>
    CHART_LEFT +
    (items.length > 1 ? (index / (items.length - 1)) * graphWidth : graphWidth / 2);
  const chartY = (value) =>
    CHART_BOTTOM - (value / chartMax) * graphHeight;
  const chartPath = (key) =>
    items
      .map(
        (item, index) =>
          (index === 0 ? "M" : "L") +
          chartX(index) +
          " " +
          chartY(item[key]),
      )
      .join(" ");
  const labelStep = Math.max(1, Math.ceil(items.length / 6));
  const hoveredItem =
    Number.isInteger(hoveredIndex) && hoveredIndex >= 0
      ? items[hoveredIndex]
      : null;
  const hoveredTotalY = hoveredItem
    ? chartY(hoveredItem.totalCount)
    : CHART_TOP;
  const tooltipStyle = hoveredItem
    ? {
        left:
          Math.min(88, Math.max(12, (chartX(hoveredIndex) / CHART_WIDTH) * 100)) +
          "%",
        top: Math.min(76, Math.max(4, (hoveredTotalY / CHART_HEIGHT) * 100 - 18)) +
          "%",
      }
    : undefined;

  return (
    <section
      aria-labelledby="interaction-chart-title"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Community analytics
          </p>
          <h2
            id="interaction-chart-title"
            className="mt-1 text-lg font-bold text-slate-900"
          >
            Interaction Chart
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Daily likes, bookmarks, and comments. Calendar dates use{" "}
            {resource?.data?.timezone || "Asia/Ho_Chi_Minh"}.
          </p>
        </div>
        <div
          aria-label="Chart period filters"
          className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
        >
          <button
            type="button"
            aria-pressed={days === 7}
            onClick={() => onDaysChange(7)}
            className={
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors " +
              (days === 7
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-slate-500 hover:bg-white hover:text-slate-800")
            }
          >
            Last 7 days
          </button>
          <button
            type="button"
            aria-pressed={days === 30}
            onClick={() => onDaysChange(30)}
            className={
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors " +
              (days === 30
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-slate-500 hover:bg-white hover:text-slate-800")
            }
          >
            Last 30 days
          </button>
        </div>
      </div>
      <div className="pt-5">
        {resource?.status === "loading" && (
          <div
            aria-label="Loading interaction chart"
            className="h-64 animate-pulse rounded-xl bg-slate-50"
          />
        )}
        {(resource?.status === "error" ||
          resource?.status === "unavailable") && (
          <SectionMessage
            Icon={Activity}
            title={
              resource.status === "unavailable"
                ? "Interaction statistics are unavailable"
                : "Interaction statistics could not be loaded"
            }
            action={
              resource.status === "error" ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-emerald-50"
                >
                  Retry
                </button>
              ) : null
            }
          >
            {resource.status === "unavailable"
              ? "The dashboard interaction statistics endpoint is not available."
              : "The request failed. Try refreshing the dashboard."}
          </SectionMessage>
        )}
        {resource?.status === "success" && (
          <>
            <div className="relative">
              {hoveredItem && (
                <div
                  role="status"
                  style={tooltipStyle}
                  className="pointer-events-none absolute z-10 min-w-40 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
                >
                  <p className="mb-1 font-semibold text-slate-800">
                    {formatChartDate(hoveredItem.date, true)}
                  </p>
                  {CHART_SERIES.map((series) => (
                    <p
                      key={series.key}
                      className="flex items-center justify-between gap-4 text-slate-600"
                    >
                      <span>{series.label}</span>
                      <strong className="font-semibold text-slate-900">
                        {formatCount(hoveredItem[series.key])}
                      </strong>
                    </p>
                  ))}
                  <p className="mt-1 flex justify-between gap-4 border-t border-slate-100 pt-1 font-semibold text-slate-800">
                    <span>Total</span>
                    <span>{formatCount(hoveredItem.totalCount)}</span>
                  </p>
                </div>
              )}
              <svg
                role="img"
                aria-label={
                  "Daily likes, bookmarks, and comments over the last " +
                  days +
                  " days"
                }
                viewBox={"0 0 " + CHART_WIDTH + " " + CHART_HEIGHT}
                className="h-auto w-full overflow-visible"
              >
                {[0, 1, 2, 3, 4].map((tick) => {
                  const value = (chartMax / 4) * tick;
                  const y = chartY(value);
                  return (
                    <g key={tick}>
                      <line
                        x1={CHART_LEFT}
                        x2={CHART_WIDTH - CHART_RIGHT}
                        y1={y}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray={tick === 0 ? undefined : "3 5"}
                      />
                      <text
                        x={CHART_LEFT - 9}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-400 text-[10px]"
                      >
                        {formatCount(value)}
                      </text>
                    </g>
                  );
                })}
                {CHART_SERIES.map((series) => (
                  <path
                    key={series.key}
                    d={chartPath(series.key)}
                    fill="none"
                    stroke={series.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {Number.isInteger(hoveredIndex) && items[hoveredIndex] && (
                  <line
                    x1={chartX(hoveredIndex)}
                    x2={chartX(hoveredIndex)}
                    y1={CHART_TOP}
                    y2={CHART_BOTTOM}
                    stroke="#94a3b8"
                    strokeDasharray="3 4"
                  />
                )}
                {items.map((item, index) => (
                  <g
                    key={item.date}
                    role="img"
                    tabIndex={0}
                    aria-label={
                      formatChartDate(item.date, true) +
                      ": " +
                      formatCount(item.likeCount) +
                      " likes, " +
                      formatCount(item.bookmarkCount) +
                      " bookmarks, " +
                      formatCount(item.commentCount) +
                      " comments."
                    }
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(index)}
                    onBlur={() => setHoveredIndex(null)}
                    className="outline-none"
                  >
                    {CHART_SERIES.map((series) => (
                      <circle
                        key={series.key}
                        cx={chartX(index)}
                        cy={chartY(item[series.key])}
                        r={hoveredIndex === index ? 4 : 2.5}
                        fill={series.color}
                      />
                    ))}
                    <rect
                      x={
                        chartX(index) -
                        graphWidth / Math.max(1, items.length - 1) / 2
                      }
                      y={CHART_TOP}
                      width={
                        graphWidth / Math.max(1, items.length - 1)
                      }
                      height={graphHeight}
                      fill="transparent"
                    />
                  </g>
                ))}
                {items.map((item, index) => {
                  const isLabel =
                    index === 0 ||
                    index === items.length - 1 ||
                    index % labelStep === 0;
                  if (!isLabel) return null;
                  return (
                    <text
                      key={item.date + "-label"}
                      x={chartX(index)}
                      y={CHART_HEIGHT - 5}
                      textAnchor={
                        index === 0
                          ? "start"
                          : index === items.length - 1
                            ? "end"
                            : "middle"
                      }
                      className="fill-slate-400 text-[10px]"
                    >
                      {formatChartDate(item.date)}
                    </text>
                  );
                })}
              </svg>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {CHART_SERIES.map((series) => (
                  <span
                    key={series.key}
                    className="inline-flex items-center gap-2 text-xs text-slate-500"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: series.color }}
                    />
                    {series.label}
                  </span>
                ))}
              </div>
              {items.every((item) => item.totalCount === 0) && (
                <p className="text-xs text-slate-400">
                  No interactions recorded in this date range.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function TopContributors({ resource, onRetry }) {
  return (
    <section
      aria-labelledby="top-contributors-title"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-4">
        <h2
          id="top-contributors-title"
          className="text-base font-bold text-slate-900"
        >
          Top Contributors
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Ranked by approved posts from active USER accounts.
        </p>
      </div>
      {resource?.status === "loading" && (
        <div className="space-y-3 py-1" aria-label="Loading top contributors">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="flex animate-pulse items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 rounded bg-slate-100" />
                <div className="h-2.5 w-20 rounded bg-slate-100" />
              </div>
              <div className="h-3 w-10 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}
      {(resource?.status === "error" ||
        resource?.status === "unavailable") && (
        <SectionMessage
          Icon={Users}
          title={
            resource.status === "unavailable"
              ? "Contributor ranking unavailable"
              : "Contributor ranking could not be loaded"
          }
          action={
            resource.status === "error" ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-emerald-50"
              >
                Retry
              </button>
            ) : null
          }
        >
          {resource.status === "unavailable"
            ? "The dashboard contributor endpoint is not available."
            : "The request failed. Try refreshing the dashboard."}
        </SectionMessage>
      )}
      {resource?.status === "success" && resource.data.items.length === 0 && (
        <SectionMessage Icon={Users} title="No contributors yet">
          No active USER account has an approved post.
        </SectionMessage>
      )}
      {resource?.status === "success" && resource.data.items.length > 0 && (
        <ol className="space-y-2">
          {resource.data.items.map((contributor) => (
            <li
              key={contributor.userId}
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
            >
              <span className="w-6 shrink-0 text-center text-xs font-bold text-slate-400">
                {String(contributor.rank).padStart(2, "0")}
              </span>
              <AuthorAvatar
                name={contributor.displayName}
                avatarUrl={contributor.avatarUrl}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {contributor.displayName}
                </p>
                <p className="text-xs text-slate-400">Approved posts</p>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
                {formatCount(contributor.contributionCount)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function DashboardHeader({ onRefresh, isLoading }) {
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          ChayBook administration
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Overview of your ChayBook platform
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="text-xs font-medium text-slate-500">{today}</span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw
            aria-hidden="true"
            size={16}
            className={isLoading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>
    </header>
  );
}

function AdminDashboardPage() {
  const [resources, setResources] = useState(initialResources);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chartDays, setChartDays] = useState(7);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const load = (key, request, transform) => {
      Promise.resolve()
        .then(() => request(signal))
        .then(transform)
        .then((data) => {
          setResources((current) => ({
            ...current,
            [key]: { status: "success", data },
          }));
        })
        .catch((error) => {
          if (signal.aborted || error?.name === "AbortError") return;
          setResources((current) => ({
            ...current,
            [key]: {
              status: classifyRequestError(error),
              data: null,
            },
          }));
        });
    };

    load(
      "users",
      (requestSignal) =>
        getAdminUserStatistics({ signal: requestSignal }),
      (response) => ({
        count: normalizeCount(response?.totalAccounts, "user statistics"),
        empty: Number(response?.totalAccounts) === 0,
      }),
    );

    load(
      "posts",
      (requestSignal) => getPosts(null, 0, 4, { signal: requestSignal }),
      (response) => normalizePage(response, "posts"),
    );

    load(
      "articles",
      (requestSignal) => getAdminArticlePage({ page: 0, size: 1, signal: requestSignal }),
      (response) => ({
        count: normalizeCount(response?.totalElements, "admin article"),
        empty: Number(response?.totalElements) === 0,
      }),
    );

    load(
      "interactionRate",
      (requestSignal) =>
        getAdminInteractionRate({ signal: requestSignal }),
      normalizeInteractionRate,
    );

    load(
      "aiMessages",
      (requestSignal) => getAdminAiMessageCount({ signal: requestSignal }),
      normalizeAiMessageCount,
    );

    load(
      "contributors",
      (requestSignal) =>
        getAdminTopContributors({ signal: requestSignal }),
      normalizeTopContributors,
    );

    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    Promise.resolve()
      .then(() =>
        getAdminInteractionChart({ days: chartDays, signal }),
      )
      .then((response) => normalizeInteractionChart(response, chartDays))
      .then((data) => {
        setResources((current) => ({
          ...current,
          chart: { status: "success", data },
        }));
      })
      .catch((error) => {
        if (signal.aborted || error?.name === "AbortError") return;
        setResources((current) => ({
          ...current,
          chart: {
            status: classifyRequestError(error),
            data: null,
          },
        }));
      });

    return () => controller.abort();
  }, [chartDays, refreshKey]);

  const isLoading = Object.values(resources).some(
    (resource) => resource.status === "loading",
  );
  const refresh = () => {
    setResources(initialResources);
    setRefreshKey((value) => value + 1);
  };
  const changeChartDays = (days) => {
    if (days === chartDays) return;
    setResources((current) => ({
      ...current,
      chart: { status: "loading", data: null },
    }));
    setChartDays(days);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1500px]">
      <DashboardHeader onRefresh={refresh} isLoading={isLoading} />

      <section
        aria-label="Platform statistics"
        className="mb-6 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
      >
        <StatCard
          title="Total Users"
          Icon={Users}
          resource={resources.users}
          detail="Registered USER accounts."
          onRetry={refresh}
        />
        <StatCard
          title="Approved Posts"
          Icon={MessageSquareText}
          resource={resources.posts}
          detail="Only approved posts returned by the community API."
          unavailableReason="Post statistics are not available yet."
          onRetry={refresh}
        />
        <StatCard
          title="Total Articles"
          Icon={FileText}
          resource={resources.articles}
          detail="Articles returned by the admin article API."
          onRetry={refresh}
        />
        <StatCard
          title="Interaction Rate"
          Icon={Activity}
          resource={resources.interactionRate}
          valueFormatter={formatPercent}
          detail="Share of approved posts with at least one like, bookmark, or comment."
          onRetry={refresh}
        />
        <StatCard
          title="Total AI Messages"
          Icon={MessageCircle}
          resource={resources.aiMessages}
          detail="Includes saved user prompts and AI replies."
          onRetry={refresh}
        />
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="min-w-0 space-y-5 xl:col-span-7">
          <InteractionChart
            resource={resources.chart}
            days={chartDays}
            onDaysChange={changeChartDays}
            onRetry={refresh}
          />
        </div>
        <div className="min-w-0 space-y-5 xl:col-span-5">
          <LatestPosts resource={resources.posts} onRetry={refresh} />
          <TopContributors
            resource={resources.contributors}
            onRetry={refresh}
          />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
