import { useRef, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bookmark,
  CalendarDays,
  ChefHat,
  ChevronRight,
  Eye,
  Heart,
  Lightbulb,
  List,
  Play,
  Share2,
  Sparkles,
  Timer,
  AlertTriangle,
} from "lucide-react";

import { getArticleDetail } from "../services/articleServices";

function ContentNotFound() {
  return (
    <section className="mx-auto flex min-h-[55vh] w-full max-w-7xl flex-col items-center justify-center px-4 py-space-3xl text-center sm:px-6 lg:px-margin-desktop">
      <h1 className="text-headline-xl font-headline-xl text-on-surface">
        Content Not Found
      </h1>
      <p className="mt-3 max-w-lg text-body-md font-body-md text-on-surface-variant">
        The content you are looking for does not exist.
      </p>
      <Link
        to="/content"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-space-md py-2.5 text-label-md font-label-md text-on-primary transition-colors hover:bg-primary-container"
      >
        <ArrowLeft size={18} />
        Back to Content
      </Link>
    </section>
  );
}

function Breadcrumb({ post }) {
  return (
    <div className="mb-space-lg flex flex-wrap items-center justify-between gap-space-sm">
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 flex-wrap items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant"
      >
        <Link className="transition-colors hover:text-primary" to="/">
          Home
        </Link>
        <ChevronRight aria-hidden="true" size={14} className="text-outline" />
        <Link className="transition-colors hover:text-primary" to="/content">
          Content
        </Link>
        <ChevronRight aria-hidden="true" size={14} className="text-outline" />
        <Link className="transition-colors hover:text-primary" to="/content">
          {post.categoryLabel}
        </Link>
        <ChevronRight aria-hidden="true" size={14} className="text-outline" />
        <span className="max-w-[200px] truncate font-semibold text-on-surface sm:max-w-none">
          {post.title}
        </span>
      </nav>

      <Link
        to="/content"
        className="group inline-flex shrink-0 items-center gap-space-xs rounded-full bg-secondary-container/40 px-space-sm py-1.5 text-label-md font-label-md text-primary transition-colors hover:bg-secondary-container"
      >
        <ArrowLeft
          aria-hidden="true"
          size={18}
          className="transition-transform group-hover:-translate-x-0.5"
        />
        Back to Content
      </Link>
    </div>
  );
}

function ContentActions({
  liked,
  saved,
  likeCount,
  onLike,
  onSave,
  onShare,
  onCookMode,
}) {
  const actionClass =
    "inline-flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-space-md py-2.5 text-label-md font-label-md text-on-surface shadow-sm transition-colors hover:bg-secondary-container/40";

  return (
    <div className="flex flex-wrap items-center gap-space-xs pb-space-xs sm:gap-space-sm">
      <button
        type="button"
        aria-pressed={liked}
        onClick={onLike}
        className={actionClass}
      >
        <Heart
          aria-hidden="true"
          size={20}
          className={liked ? "fill-error text-error" : "text-error"}
        />
        <span>
          {liked ? `Liked (${likeCount + 1})` : `Like (${likeCount})`}
        </span>
      </button>
      <button
        type="button"
        aria-pressed={saved}
        onClick={onSave}
        className={actionClass}
      >
        <Bookmark
          aria-hidden="true"
          size={20}
          className={saved ? "fill-primary text-primary" : ""}
        />
        <span>{saved ? "Saved" : "Save Recipe"}</span>
      </button>
      <button type="button" onClick={onShare} className={actionClass}>
        <Share2 aria-hidden="true" size={20} />
        <span>Share</span>
      </button>
      <button
        type="button"
        onClick={onCookMode}
        className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-primary px-space-md py-2.5 text-label-md font-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container"
      >
        <ChefHat aria-hidden="true" size={20} />
        <span>Cook Mode</span>
      </button>
    </div>
  );
}

function IngredientsSection({ ingredients }) {
  return (
    <section
      aria-labelledby="ingredients-heading"
      className="space-y-space-md"
      id="ingredients"
    >
      <h2
        className="text-headline-md font-headline-md text-on-surface"
        id="ingredients-heading"
      >
        Fresh Ingredients
      </h2>
      <ul className="space-y-space-xs pt-space-xs">
        {ingredients.map((ingredient) => (
          <li
            key={`${ingredient.amount}-${ingredient.name}`}
            className="text-body-md font-body-md text-on-surface"
          >
            <span className="font-semibold">{ingredient.amount}</span>{" "}
            {ingredient.name} — {ingredient.description}
          </li>
        ))}
      </ul>
    </section>
  );
}

function VideoTutorial({ video, title, onPlay }) {
  return (
    <section
      aria-labelledby="video-heading"
      className="space-y-space-sm rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm"
      id="video-tutorial"
    >
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div>
          <h2
            className="text-headline-md font-headline-md text-on-surface"
            id="video-heading"
          >
            Video Tutorial
          </h2>
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            {video.description}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-1 text-label-sm font-label-sm text-on-secondary-container">
          <Timer aria-hidden="true" size={16} />
          {video.duration}
        </span>
      </div>

      <div className="group relative w-full overflow-hidden rounded-xl shadow-md">
        <img
          src={video.previewImage}
          alt={`Video preview of ${title}`}
          className="h-72 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 sm:h-96"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-inverse-surface/30 transition-colors group-hover:bg-inverse-surface/20">
          <button
            type="button"
            aria-label="Play video preview"
            onClick={onPlay}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-lowest/95 text-primary shadow-lg transition-transform group-hover:scale-110"
          >
            <Play aria-hidden="true" size={34} fill="currentColor" />
          </button>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-inverse-surface/60 px-3 py-2 text-caption font-caption text-inverse-on-surface backdrop-blur-md">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Full Culinary Walkthrough (1080p)
          </span>
          <span>HD · Subtitles Available</span>
        </div>
      </div>
    </section>
  );
}

function InstructionsSection({ instructions }) {
  return (
    <section
      aria-labelledby="instructions-heading"
      className="space-y-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm"
      id="instructions"
    >
      <div className="flex flex-wrap items-center justify-between gap-space-xs">
        <h2
          className="text-headline-md font-headline-md text-on-surface"
          id="instructions-heading"
        >
          Step-by-Step Instructions
        </h2>
        <span className="text-caption font-caption text-on-surface-variant">
          {instructions.length} Methodical Steps
        </span>
      </div>
      <ol className="space-y-space-md">
        {instructions.map((instruction) => (
          <li
            key={instruction.step}
            className="flex items-start gap-space-md rounded-xl bg-surface-container-low p-space-md"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-label-md font-bold text-on-primary">
              {instruction.step}
            </span>
            <div className="min-w-0 space-y-1">
              <h3 className="text-headline-sm font-headline-sm text-on-surface">
                {instruction.title}
              </h3>
              <p className="text-body-md font-body-md leading-relaxed text-on-surface-variant">
                {instruction.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CommentsSection({
  comments,
  commentCount,
  comment,
  commentInputRef,
  onCommentChange,
  onCommentSubmit,
  commentFeedback,
}) {
  return (
    <section
      aria-labelledby="comments-heading"
      className="space-y-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm"
      id="comments"
    >
      <div className="flex flex-wrap items-center justify-between gap-space-xs">
        <h2
          className="text-headline-md font-headline-md text-on-surface"
          id="comments-heading"
        >
          Comments ({commentCount})
        </h2>
        <span className="text-caption font-caption text-on-surface-variant">
          Community Feedback
        </span>
      </div>

      <form
        onSubmit={onCommentSubmit}
        className="flex items-start gap-space-sm"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-label-md font-bold text-on-secondary-container">
          U
        </div>
        <div className="min-w-0 flex-1 space-y-space-xs">
          <textarea
            ref={commentInputRef}
            aria-label="Your comment"
            className="w-full resize-none rounded-xl bg-surface-container-low p-space-sm text-body-md font-body-md text-on-surface transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
            onChange={(event) => onCommentChange(event.target.value)}
            placeholder="Share your cooking experience or ask a question..."
            rows={3}
            value={comment}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              aria-live="polite"
              className="text-caption font-caption text-on-surface-variant"
            >
              {commentFeedback}
            </p>
            <button
              type="submit"
              className="rounded-lg bg-primary px-space-md py-2 text-label-md font-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container"
            >
              Post Comment
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-space-md pt-space-sm">
        {comments.length > 0 ? (
          comments.map((item) => (
            <article
              key={item.id}
              className="space-y-space-xs rounded-xl bg-surface-container-low p-space-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-space-xs">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tertiary-container text-caption font-bold text-on-tertiary-container">
                    {item.initials}
                  </div>
                  <div>
                    <span className="text-label-md font-label-md text-on-surface">
                      {item.author}
                    </span>
                    <span className="ml-1 text-caption font-caption text-on-surface-variant">
                      · {item.role}
                    </span>
                  </div>
                </div>
                <span className="text-caption font-caption text-on-surface-variant">
                  {item.time}
                </span>
              </div>
              <p className="pl-space-lg text-body-md font-body-md leading-relaxed text-on-surface">
                {item.content}
              </p>
              <div className="flex items-center gap-space-md pl-space-lg text-body-sm font-body-sm text-on-surface-variant">
                <span className="inline-flex items-center gap-1">
                  <Heart aria-hidden="true" size={16} />
                  {item.likes}
                </span>
                <button
                  type="button"
                  onClick={() => commentInputRef.current?.focus()}
                  className="transition-colors hover:text-primary"
                >
                  Reply
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-xl bg-surface-container-low p-space-md text-body-sm font-body-sm text-on-surface-variant">
            No comments are available to display yet.
          </p>
        )}
      </div>
    </section>
  );
}

function RecipeSidebar({ post, detail, relatedPosts }) {
  const navigationItems = [
    { id: "introduction", label: "Introduction" },
    ...(detail
      ? [
          { id: "ingredients", label: "Fresh Ingredients" },
          { id: "video-tutorial", label: "Video Tutorial" },
          { id: "instructions", label: "Step-by-Step Instructions" },
          { id: "comments", label: "User Comments" },
        ]
      : []),
  ];

  return (
    <aside className="min-w-0 space-y-space-lg lg:sticky lg:top-24 lg:col-span-4">
      <section className="space-y-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="flex items-center gap-2 text-on-surface">
          <List aria-hidden="true" size={20} className="text-primary" />
          <h2 className="text-headline-sm font-headline-sm">
            {post.category === "recipes" ? "In This Recipe" : "In This Content"}
          </h2>
        </div>
        <nav className="flex flex-col space-y-1 text-body-sm font-body-sm text-on-surface-variant">
          {navigationItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-secondary-container/40 hover:text-primary"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="truncate">{item.label}</span>
              </span>
              <ArrowRight aria-hidden="true" size={16} className="shrink-0" />
            </a>
          ))}
        </nav>
      </section>

      {detail?.chefTip && (
        <section className="space-y-space-xs rounded-2xl bg-secondary-container/40 p-space-md text-on-surface shadow-sm">
          <div className="flex items-center gap-2 text-headline-sm font-headline-sm text-primary">
            <Lightbulb aria-hidden="true" size={24} />
            <h2>Chef&apos;s Pro Tip</h2>
          </div>
          <p className="text-body-sm font-body-sm leading-relaxed text-on-surface-variant">
            {detail.chefTip}
          </p>
        </section>
      )}

      <section className="space-y-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-headline-sm font-headline-sm text-on-surface">
            Related Recipes
          </h2>
          <Link
            to="/content"
            className="shrink-0 text-label-sm font-label-sm text-primary hover:underline"
          >
            See all
          </Link>
        </div>
        <div className="space-y-space-sm">
          {relatedPosts.map((relatedPost) => (
            <Link
              key={relatedPost.id}
              to={`/content/${relatedPost.id}`}
              className="group flex min-w-0 items-center gap-space-sm rounded-xl p-1.5 transition-colors hover:bg-surface-container-low"
            >
              <img
                src={relatedPost.image}
                alt={relatedPost.imageAlt}
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <h3 className="truncate text-label-md font-label-md text-on-surface transition-colors group-hover:text-primary">
                  {relatedPost.title}
                </h3>
                <p className="mt-0.5 text-caption font-caption text-on-surface-variant">
                  {relatedPost.duration}
                  {relatedPost.calories ? ` · ${relatedPost.calories}` : ""}
                </p>
                <span className="mt-1 inline-block rounded-full bg-secondary-container/50 px-2 py-0.5 text-caption font-caption text-primary">
                  {relatedPost.categoryLabel}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative space-y-space-sm overflow-hidden rounded-2xl bg-primary p-space-lg text-on-primary shadow-md">
        <div className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-on-primary/10 blur-xl" />
        <div className="relative flex items-center gap-2">
          <Sparkles aria-hidden="true" size={24} />
          <span className="text-label-md font-label-md uppercase tracking-wider">
            AI Nutritionist
          </span>
        </div>
        <h2 className="relative text-headline-sm font-headline-sm leading-snug">
          Need tailored macro adjustments?
        </h2>
        <p className="relative text-body-sm font-body-sm leading-relaxed text-on-primary-container">
          Chat with ChayBook&apos;s assistant to substitute ingredients, lower
          carbs, or hit target plant protein.
        </p>
        <Link
          to="/ai-assistant"
          className="relative inline-flex w-full items-center justify-center rounded-lg bg-surface-container-lowest px-space-md py-2.5 text-label-md font-label-md text-primary shadow-sm transition-colors hover:bg-surface-container"
        >
          Launch AI ChatBox
        </Link>
      </section>
    </aside>
  );
}

function ContentDetailView({ post, detail }) {
  const initialComments = detail?.comments ?? [];
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const likeCount = detail?.likeCount ?? 0;
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(initialComments);
  const [addedCommentCount, setAddedCommentCount] = useState(0);
  const [actionFeedback, setActionFeedback] = useState("");
  const [commentFeedback, setCommentFeedback] = useState("");
  const commentInputRef = useRef(null);

  const handleCommentSubmit = (event) => {
    event.preventDefault();
    const content = comment.trim();

    if (!content) {
      setCommentFeedback("Please write a comment before posting.");
      commentInputRef.current?.focus();
      return;
    }

    setComments((currentComments) => [
      {
        id: Date.now(),
        author: "You",
        role: "Community Member",
        initials: "U",
        time: "Just now",
        content,
        likes: 0,
      },
      ...currentComments,
    ]);
    setAddedCommentCount((count) => count + 1);
    setComment("");
    setCommentFeedback("Your comment was added for this session.");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setActionFeedback("Link copied to clipboard.");
    } catch {
      setActionFeedback("Use your browser's share menu to share this page.");
    }
  };

  const handleCookMode = () => {
    setActionFeedback(
      "Cook Mode is ready. Keep the recipe open while you cook.",
    );
  };

  const handleVideoFeedback = () => {
    setActionFeedback(
      "This is a video preview. The full tutorial is not available yet.",
    );
  };

  const relatedPosts = [];

  return (
    <div className="w-full bg-background font-body-md text-on-surface antialiased">
      <div className="mx-auto w-full max-w-[1280px] px-space-md py-space-md lg:px-margin-desktop">
        <Breadcrumb post={post} />

        <div className="grid grid-cols-1 items-start gap-gutter-lg lg:grid-cols-12">
          <article className="flex min-w-0 flex-col space-y-space-xl lg:col-span-8">
            <header className="space-y-space-sm">
              <div className="flex flex-wrap items-center gap-space-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-label-sm font-label-sm text-on-secondary-container">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {post.categoryLabel}
                </span>
                {/* {detail?.eyebrow && (
                  <span className="text-caption font-caption uppercase tracking-wider text-on-surface-variant">
                    {detail.eyebrow}
                  </span>
                )} */}
              </div>
              <h1 className="text-headline-xl font-headline-xl leading-tight tracking-tight text-on-surface">
                {post.title}
              </h1>
              {/* <p className="text-body-lg font-body-lg leading-relaxed text-on-surface-variant">
                {post.description}
              </p> */}
            </header>

            <section className="flex flex-wrap items-center justify-between gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
              <div className="flex items-center gap-space-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-headline-sm font-bold text-on-primary shadow-sm">
                  {post.initials}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-label-md font-label-md text-on-surface">
                      {post.author}
                    </span>
                    {detail?.verifiedAuthor && (
                      <BadgeCheck
                        aria-label="Verified contributor"
                        size={16}
                        className="text-primary"
                      />
                    )}
                  </div>
                  <p className="text-caption font-caption text-on-surface-variant">
                    {post.authorRole}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-space-md gap-y-1 text-body-sm font-body-sm text-on-surface-variant">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays aria-hidden="true" size={18} />
                  {post.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Timer aria-hidden="true" size={18} />
                  {post.duration}
                </span>
                {detail?.views && (
                  <span className="inline-flex items-center gap-1">
                    <Eye aria-hidden="true" size={18} />
                    {detail.views} views
                  </span>
                )}
              </div>
            </section>

            <ContentActions
              liked={liked}
              saved={saved}
              likeCount={likeCount}
              onLike={() => setLiked((current) => !current)}
              onSave={() => setSaved((current) => !current)}
              onShare={handleShare}
              onCookMode={handleCookMode}
            />
            <p
              aria-live="polite"
              className="-mt-space-lg text-caption font-caption text-on-surface-variant"
            >
              {actionFeedback}
            </p>

            <div className="group relative w-full overflow-hidden rounded-2xl shadow-md">
              <img
                src={post.image}
                alt={post.imageAlt}
                className="h-[380px] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.01] sm:h-[460px]"
              />
              {detail && (
                <>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-inverse-surface/85 px-3 py-1 text-caption font-caption text-inverse-on-surface backdrop-blur-sm">
                    <Sparkles aria-hidden="true" size={14} />
                    Culinary Studio Editorial · 100% Plant Sourced
                  </div>
                  <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-surface-container-lowest/90 px-3 py-1 text-label-sm font-label-sm text-primary shadow-sm backdrop-blur-sm">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Gluten-Free & Vegan
                  </span>
                </>
              )}
            </div>

            <section
              aria-labelledby="introduction-heading"
              className="space-y-space-sm rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm"
              id="introduction"
            >
              <h2
                className="text-headline-lg font-headline-lg text-on-surface"
                id="introduction-heading"
              >
                Chi tiết bài viết
              </h2>
              {(detail?.introduction ?? [post.description]).map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-body-md font-body-md leading-relaxed text-on-surface-variant"
                >
                  {paragraph}
                </p>
              ))}
            </section>

            {detail && (
              <>
                <IngredientsSection ingredients={detail.ingredients} />
                <VideoTutorial
                  video={detail.video}
                  title={post.title}
                  onPlay={handleVideoFeedback}
                />
                <InstructionsSection instructions={detail.instructions} />
                <CommentsSection
                  comments={comments}
                  commentCount={post.comments + addedCommentCount}
                  comment={comment}
                  commentInputRef={commentInputRef}
                  onCommentChange={(value) => {
                    setComment(value);
                    setCommentFeedback("");
                  }}
                  onCommentSubmit={handleCommentSubmit}
                  commentFeedback={commentFeedback}
                />
              </>
            )}
          </article>

          <RecipeSidebar
            post={post}
            detail={detail}
            relatedPosts={relatedPosts}
          />
        </div>
      </div>
    </div>
  );
}

function ContentPageDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticleDetail = async () => {
      if (!id) {
        setError("Invalid article ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const articleId = Number(id);
        const data = await getArticleDetail(articleId);
        setArticle(data);
      } catch (err) {
        setError(err.message || "Failed to fetch article detail");
        console.error("Error fetching article detail:", err);
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArticleDetail();
  }, [id]);

  if (loading) {
    return (
      <section className="min-h-[55vh] w-full max-w-7xl flex-col items-center justify-center px-4 py-space-3xl text-center sm:px-6 lg:px-margin-desktop">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chaybook-primary mb-4"></div>
        <p className="text-body-md font-body-md text-on-surface-variant">
          Loading article detail...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-[55vh] w-full max-w-7xl flex-col items-center justify-center px-4 py-space-3xl text-center sm:px-6 lg:px-margin-desktop">
        <span aria-hidden="true" size={24}>
          <AlertTriangle className="h-6 w-6 text-error mb-4" />
        </span>
        <h1 className="text-headline-xl font-headline-xl text-on-surface">
          Error Loading Article
        </h1>
        <p className="mt-3 max-w-lg text-body-md font-body-md text-on-surface-variant">
          {error}
        </p>
        <Link
          to="/content"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-space-md py-2.5 text-label-md font-label-md text-on-primary transition-colors hover:bg-primary-container"
        >
          <ArrowLeft size={18} />
          Back to Content
        </Link>
      </section>
    );
  }

  if (!article) {
    return <ContentNotFound />;
  }

  // Convert API response to the format expected by ContentDetailView
  // The API returns ArticleResponse, but ContentDetailView expects a post object with specific fields
  const post = {
    id: article.articleId,
    categoryId: article.categoryId,
    title: article.title || "",
    description: article.content || "", // Using content as description
    image: article.coverImage || "",
    imageAlt: article.title || "Article", // Using title as alt text
    authorId: article.createdBy, // We don't have author name from API, so we'll use ID
    author: `User ${article.createdBy}`, // Placeholder since we don't have user info
    authorRole: "", // Not available in API
    initials: "", // Not available in API
    authorColor: "", // Not available in API
    content: article.content || "",
    coverImage: article.coverImage || "",
    status: article.status || "",
    createdAt: article.createdAt || "",
    updatedAt: article.updatedAt || "",
    // These fields are not in API but are expected by ContentDetailView - providing empty/default values
    likeCount: 0,
    comments: 0,
    views: 0,
    // We don't have these from the article API, so we'll leave them empty/default
    // ContentDetailView expects detail object with these fields, but we don't have them
    // So we'll pass null for detail and handle it in ContentDetailView
  };

  // Since we don't have the detail data from the article API,
  // we'll pass null and let ContentDetailView handle it gracefully
  // Or we could fetch additional detail data if there's a separate endpoint
  const detail = null; // We don't have detail data from the basic article API

  return <ContentDetailView key={post.id} post={post} detail={detail} />;
}

export default ContentPageDetail;
