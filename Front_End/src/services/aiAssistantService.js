import { apiFetch } from "./api";

/**
 * Sends a user prompt to the AI assistant and returns an assistant message object.
 * @param {string} prompt - The user's message text.
 * @returns {Promise<{id: string, role: string, content: string, createdAt: string}>}
 */
export async function sendAIMessage(prompt) {
  try {
    const response = await apiFetch("/chatbot/messages", {
      method: "POST",
      body: {
        message: prompt,
        conversationId: null,
      },
    });

    return {
      id: response.messageId ?? `assistant-${Date.now()}`,
      role: "assistant",
      content: response.content,
      createdAt: "Just now",
    };
  } catch (err) {
    console.error("Error calling AI assistant API:", err);
    // Re-throw so the calling component can handle it
    throw err;
  }
}