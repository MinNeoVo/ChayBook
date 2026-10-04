// Phase 1: Service abstraction for the AI Assistant.
// Currently delegates to the local mock. Replace the body of sendAIMessage
// with a real API call (POST /api/ai/chat) in a later phase.

import { getMockAIResponse } from "../mocks/aiAssistantMock";

/**
 * Sends a user prompt to the AI assistant and returns an assistant message object.
 * @param {string} prompt - The user's message text.
 * @returns {Promise<{id: string, role: string, content: string, createdAt: string}>}
 */
export async function sendAIMessage(prompt) {
  // Simulate network / processing latency for Phase 1 prototype.
  await new Promise((resolve) => setTimeout(resolve, 700));

  const content = getMockAIResponse(prompt);

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content,
    createdAt: "Just now",
  };
}

