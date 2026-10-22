import { isVideoMedia, resolveMediaUrl } from "./mediaUtils";

function MediaRenderer({
  src,
  alt = "",
  className = "",
  controls = true,
  muted = false,
  autoPlay = false,
  loop = false,
  onClick,
  onError,
}) {
  const mediaUrl = resolveMediaUrl(src);
  if (!mediaUrl) return null;

  if (isVideoMedia(mediaUrl)) {
    return (
      <video
        src={mediaUrl}
        aria-label={alt}
        controls={controls}
        muted={muted}
        autoPlay={autoPlay}
        loop={loop}
        playsInline
        preload="metadata"
        className={className}
        onClick={onClick}
        onError={onError}
      />
    );
  }

  return (
    <img
      src={mediaUrl}
      alt={alt}
      loading="lazy"
      className={className}
      onClick={onClick}
      onError={onError}
    />
  );
}

export default MediaRenderer;
