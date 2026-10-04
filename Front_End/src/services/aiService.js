import { getMockAIResponse } from "../mocks/aiAssistantMock";

/**
 * Phase 1 local mock implementation of the AI Assistant service.
 * In Phase 2, this function will call the Spring Boot AI endpoint (POST /api/ai/chat).
 */
export async function sendAIMessage(prompt) {
  // Simulate network response latency for realistic UI experience
  await new Promise((resolve) => setTimeout(resolve, 700));

  const responseText = getMockAIResponse(prompt);
  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content: responseText,
    createdAt: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

