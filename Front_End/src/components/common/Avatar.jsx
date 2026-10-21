import { UserRound } from "lucide-react";
import { useState } from "react";
import API_BASE_URL from "../../services/app";

// Lấy origin từ API base URL (vd: "http://localhost:8080")
const API_ORIGIN = new URL(API_BASE_URL).origin;

/**
 * Resolve avatar URL:
 *  - Nếu là relative path ("/uploads/...") → prepend API origin
 *  - Nếu đã là absolute URL (http/https) → giữ nguyên
 *  - Nếu null/undefined → trả về null (hiện icon mặc định)
 */
function resolveAvatarSrc(src) {
  const value = typeof src === "string" ? src.trim() : "";
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
}

function Avatar({ src, alt = "Avatar", size = "md", className = "" }) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  const resolvedSrc = resolveAvatarSrc(src);
  const [failedImage, setFailedImage] = useState(null);
  const imageFailed = failedImage === resolvedSrc;

  return (
    <div
      className={`${
        sizes[size] || sizes.md
      } shrink-0 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center ${className}`}
    >
      {resolvedSrc && !imageFailed ? (
        <img
          src={resolvedSrc}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setFailedImage(resolvedSrc)}
        />
      ) : (
        <UserRound className="h-1/2 w-1/2  text-chaybook-primary " />
      )}
    </div>
  );
}

export default Avatar;
