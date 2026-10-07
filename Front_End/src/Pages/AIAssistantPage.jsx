import { useState } from "react";

import AIHeader from "../components/ai/AIHeader";
import ChatMessageList from "../components/ai/ChatMessageList";
import ChatInput from "../components/ai/ChatInput";
import SuggestionChips from "../components/ai/SuggestionChips";

import { useAuth } from "../context/useAuth";

import { X, Check } from "lucide-react";

import { sendAIMessage } from "../services/aiAssistantService";

function AIAssistantPage() {
  const { user } = useAuth();

  // Không còn tin nhắn mẫu
  const [messages, setMessages] = useState([]);

  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [lastUserPrompt, setLastUserPrompt] = useState("");

  const [activeModal, setActiveModal] = useState(null);

  const handleSendMessage = async (text) => {
    if (!text || !text.trim()) {
      return;
    }

    setError(null);
    setLastUserPrompt(text);

    const now = new Date();

    const formattedTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: formattedTime,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const aiMessage = await sendAIMessage(text);

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("AI Assistant error:", err);

      let errorMessage = "Không thể tạo câu trả lời. Vui lòng thử lại.";

      if (err.status === 429) {
        errorMessage =
          "Bạn đã hết 3 lượt dùng thử hôm nay. Vui lòng đăng nhập để tiếp tục sử dụng AI Assistant.";
      } else if (err.status === 503) {
        errorMessage =
          "AI Assistant đang tạm thời quá tải. Vui lòng thử lại sau.";
      } else if (err.status === 401) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError({
        message: errorMessage,
        status: err.status,
        originalPrompt: text,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetry = () => {
    // Hết lượt trial thì không cho retry
    if (error?.status === 429) {
      return;
    }

    if (lastUserPrompt) {
      handleSendMessage(lastUserPrompt);
    }
  };

  const handleReset = () => {
    // Reset về chat trống
    setMessages([]);
    setError(null);
    setIsTyping(false);
    setLastUserPrompt("");
  };

  const handleClearAll = () => {
    setMessages([]);
    setError(null);
    setIsTyping(false);
  };

  return (
    <div className="w-full bg-chaybook-bg px-3 py-4 sm:px-6 sm:py-6 lg:py-8">
      <div className="mx-auto flex h-[calc(100vh-8.5rem)] min-h-[580px] max-w-[1040px] flex-col rounded-3xl border border-gray-200/80 bg-chaybook-container/40 p-3 shadow-xs backdrop-blur-xs sm:p-5">
        {/* AI Header */}
        <AIHeader
          onReset={handleReset}
          onOpenHistory={() => setActiveModal("sessions")}
          onOpenPreferences={() => setActiveModal("preferences")}
        />

        {/* Message count */}
        <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-gray-500">
          <span>
            {messages.length} message
            {messages.length === 1 ? "" : "s"} in session
          </span>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="cursor-pointer text-gray-400 transition-colors hover:text-red-500"
            >
              Clear conversation
            </button>
          )}
        </div>

        {/* Chat messages */}
        <ChatMessageList
          messages={messages}
          isTyping={isTyping}
          error={error}
          onRetry={handleRetry}
          onSelectSuggestion={handleSendMessage}
          userName={user?.fullName || user?.name || "You"}
        />

        {/* Input */}
        <div className="mt-auto flex flex-col gap-2.5 border-t border-gray-200/60 pt-3">
          <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />

          <SuggestionChips
            onSelectSuggestion={handleSendMessage}
            disabled={isTyping}
          />
        </div>
      </div>

      {/* =========================
          HISTORY MODAL
          ========================= */}
      {activeModal === "sessions" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Recent Sessions (UI Preview)
              </h3>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 py-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                <p className="text-sm font-semibold text-gray-800">
                  3-Day Vegetarian Meal Plan
                </p>

                <span className="text-xs text-gray-500">
                  Today, 10:42 AM • Active
                </span>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 opacity-60">
                <p className="text-sm font-semibold text-gray-800">
                  High-Protein Plant Alternatives
                </p>

                <span className="text-xs text-gray-500">
                  Yesterday • 14 messages
                </span>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400">
              Session persistence will be integrated with backend API in a later
              phase.
            </p>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="cursor-pointer rounded-xl bg-chaybook-primary px-4 py-2 text-xs font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          PREFERENCES MODAL
          ========================= */}
      {activeModal === "preferences" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Diet Preferences (UI Preview)
              </h3>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 py-4">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Vegetarian Diet Type
                  </p>

                  <span className="text-xs text-gray-500">
                    Lacto-Ovo Vegetarian
                  </span>
                </div>

                <Check className="h-4 w-4 text-chaybook-primary" />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Nut &amp; Peanut Free
                  </p>

                  <span className="text-xs text-gray-500">
                    Synched from profile
                  </span>
                </div>

                <Check className="h-4 w-4 text-chaybook-primary" />
              </div>
            </div>

            <p className="text-center text-xs text-gray-400">
              Diet preference profile sync will be connected in a later phase.
            </p>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="cursor-pointer rounded-xl bg-chaybook-primary px-4 py-2 text-xs font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIAssistantPage;
