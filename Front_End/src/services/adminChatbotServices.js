import { apiFetch } from "./api";

export function getAdminChatbotPrompt({ signal } = {}) {
  return apiFetch("/admin/chatbot/prompt", { signal });
}

export function updateAdminChatbotPrompt(prompt) {
  return apiFetch("/admin/chatbot/prompt", { method: "PUT", body: { prompt } });
}
