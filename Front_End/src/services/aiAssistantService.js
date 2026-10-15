import { apiFetch } from "./api";

const GUEST_ID_STORAGE_KEY = "chaybook.ai.guestId";

function getGuestId() {
  let guestId = window.localStorage.getItem(GUEST_ID_STORAGE_KEY);

  if (!guestId) {
    guestId = window.crypto?.randomUUID?.() ??
      `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(GUEST_ID_STORAGE_KEY, guestId);
  }

  return guestId;
}

/**
 * Sends a user prompt to the AI assistant and returns an assistant message object.
 * @param {string} prompt - The user's message text.
 * @returns {Promise<object>} Assistant message, including remaining guest questions.
 */
export async function sendAIMessage(prompt) {
  try {
    const response = await apiFetch("/chatbot/messages", {
      method: "POST",
      body: {
        message: prompt,
        conversationId: null,
      },
      headers: {
        "X-Guest-Id": getGuestId(),
      },
    });

    return {
      id: response.messageId ?? `assistant-${Date.now()}`,
      role: "assistant",
      content: response.content,
      createdAt: "Just now",
      guestQuestionsRemaining: response.guestQuestionsRemaining,
    };
  } catch (err) {
    console.error("Error calling AI assistant API:", err);
    // Re-throw so the calling component can handle it
    throw err;
  }
}