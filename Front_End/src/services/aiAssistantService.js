import { apiFetch } from "./api";

/**
 * Gửi tin nhắn đến AI assistant.
 * Nếu conversationId là null, backend tạo cuộc hội thoại mới.
 * Nếu có conversationId, backend thêm tin nhắn vào cuộc hội thoại đó.
 *
 * @param {string} prompt
 * @param {number|null} conversationId
 * @returns {Promise<{id: string|number, role: string, content: string, conversationId: number|null, createdAt: string}>}
 */
export async function sendAIMessage(prompt, conversationId = null) {
  try {
    const response = await apiFetch("/chatbot/messages", {
      method: "POST",
      body: {
        message: prompt,
        conversationId,
      },
    });

    return {
      id: response.messageId ?? `assistant-${Date.now()}`,
      role: "assistant",
      content: response.content,
      conversationId: response.conversationId ?? conversationId,
      createdAt: "Just now",
    };
  } catch (err) {
    console.error("Error calling AI assistant API:", err);
    throw err;
  }
}

/**
 * Loads the current user's conversation history.
 * Expected response: an array of conversation summaries.
 */
export async function getAIConversations() {
  return apiFetch("/chatbot/conversations");
}

/**
 * Loads and converts a conversation's messages to the format used by chat UI.
 * Expected message fields: messageId, sender, message, createdAt.
 */
export async function getAIConversationMessages(conversationId) {
  if (!conversationId) {
    throw new Error("conversationId là bắt buộc để tải tin nhắn.");
  }

  const response = await apiFetch(
    `/chatbot/conversations/${conversationId}/messages`,
  );

  if (!Array.isArray(response)) {
    throw new Error("API history phải trả về một mảng tin nhắn.");
  }

  return response.map((message) => ({
    id: message.messageId,
    role: message.sender === "USER" ? "user" : "assistant",
    content: message.message,
    createdAt: message.createdAt,
  }));
}