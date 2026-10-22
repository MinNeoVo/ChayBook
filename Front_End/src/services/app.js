const API_BASE_URL = new URL(import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api", globalThis.location?.origin || "http://localhost").href.replace(/\/+$/, "");

export default API_BASE_URL;

export const API_ORIGIN = new URL(API_BASE_URL, globalThis.location?.origin || "http://localhost").origin;
export function resolveMediaUrl(value) {
  if (!value) return null;
  if (/^(https?:|blob:|data:image\/)/i.test(value)) return value;
  return new URL(value.startsWith("/") ? value : `/${value}`, API_ORIGIN).href;
}
