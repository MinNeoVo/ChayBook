import { apiFetch } from "./api";

/**
 * Sends a user prompt to the AI assistant and returns an assistant message object.
 * @param {string} prompt - The user's message text.
 * @returns {Promise<{id: string, role: string, content: string, createdAt: string}>}
 */
export async function sendAIMessage(prompt) {
  try {
    const query = new URLSearchParams();
    // Note: We're not sending userId or conversationId for now,
    // which will make each message start a new conversation.
    // In a more complete implementation, these would be managed by state.

    const queryString = query.toString();
    const endpoint = `/chatbot/messages${queryString ? `?${queryString}` : ""}`;

    // Send the prompt as the request body
    const response = await apiFetch(endpoint, {
      method: "POST",
      body: prompt,
    });

    // The backend returns a plain string (the AI response)
    const aiResponseContent = response;

    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: aiResponseContent,
      createdAt: "Just now",
    };
  } catch (err) {
    console.error("Error calling AI assistant API:", err);
    // Re-throw so the calling component can handle it
    throw err;
  }
}

