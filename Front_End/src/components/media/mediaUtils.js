import API_BASE_URL from "../../services/app";

export function isVideoMedia(value) {
  if (typeof value !== "string") return false;
  const path = value.split(/[?#]/, 1)[0].toLowerCase();
  return path.includes("/video/upload/") || /\.(mp4|m4v|mov|webm|ogv|m3u8)$/.test(path);
}

export function resolveMediaUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";

  try {
    const url = new URL(value, `${new URL(API_BASE_URL).origin}/`);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
