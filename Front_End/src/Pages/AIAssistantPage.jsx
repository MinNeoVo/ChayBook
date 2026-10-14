import { useState } from "react";

import AIHeader from "../components/ai/AIHeader";
import ChatMessageList from "../components/ai/ChatMessageList";
import ChatInput from "../components/ai/ChatInput";
import SuggestionChips from "../components/ai/SuggestionChips";

import { useAuth } from "../context/useAuth";

import { X, Check } from "lucide-react";

import {
  sendAIMessage,
  getAIConversations,
  getAIConversationMessages,
} from "../services/aiAssistantService";

function AIAssistantPage() {
  const { user } = useAuth();

  // Lưu ID của cuộc hội thoại hiện đang mở
  const [conversationId, setConversationId] = useState(null);

  // Không còn tin nhắn mẫu
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [loadingConversationId, setLoadingConversationId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [lastUserPrompt, setLastUserPrompt] = useState("");

  const [activeModal, setActiveModal] = useState(null);

  const handleOpenHistory = async () => {
    setActiveModal("sessions");
    setHistoryError("");
    setConversations([]);

    if (!user) {
      setHistoryError("Bạn cần đăng nhập để xem lịch sử hội thoại.");
      return;
    }

    setIsHistoryLoading(true);

    try {
      const history = await getAIConversations();
      setConversations(history);
    } catch (err) {
      setHistoryError(err.message || "Không tải được lịch sử hội thoại.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    const id = conversation.conversationId;
    setLoadingConversationId(id);
    setHistoryError("");

    try {
      const historyMessages = await getAIConversationMessages(id);

      setMessages(historyMessages);
      setConversationId(id);
      setActiveModal(null);
      setError(null);
    } catch (err) {
      setHistoryError(err.message || "Không tải được tin nhắn của hội thoại.");
    } finally {
      setLoadingConversationId(null);
    }
  };

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
      // Gửi ID hiện tại; nếu là chat mới thì conversationId đang là null
      const aiMessage = await sendAIMessage(text, conversationId);

      // Lưu ID backend trả về để những tin nhắn sau tiếp tục cùng hội thoại
      if (aiMessage.conversationId != null) {
        setConversationId(aiMessage.conversationId);
      }

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
    // Bắt đầu hội thoại mới
    setMessages([]);
    setConversationId(null);
    setError(null);
    setIsTyping(false);
    setLastUserPrompt("");
  };

  const handleClearAll = () => {
    // Xóa nội dung trên giao diện và bắt đầu hội thoại mới khi gửi tiếp
    setMessages([]);
    setConversationId(null);
    setError(null);
    setIsTyping(false);
    setLastUserPrompt("");
  };

  return (
    <div className="w-full bg-chaybook-bg px-3 py-4 sm:px-6 sm:py-6 lg:py-8">
      <div className="mx-auto flex h-[calc(100vh-8.5rem)] min-h-[580px] max-w-[1040px] flex-col rounded-3xl border border-gray-200/80 bg-chaybook-container/40 p-3 shadow-xs backdrop-blur-xs sm:p-5">
        {/* AI Header */}
        <AIHeader
          onReset={handleReset}
          onOpenHistory={handleOpenHistory}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs">
          <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-5 pb-3">
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

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-5 py-4">
              {isHistoryLoading && (
                <p className="py-6 text-center text-sm text-gray-500">
                  Đang tải lịch sử hội thoại...
                </p>
              )}

              {!isHistoryLoading && historyError && (
                <p className="py-6 text-center text-sm text-red-600">
                  {historyError}
                </p>
              )}

              {!isHistoryLoading &&
                !historyError &&
                conversations.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-500">
                    Bạn chưa có hội thoại nào.
                  </p>
                )}

              {!isHistoryLoading &&
                !historyError &&
                conversations.map((conversation) => (
                  <button
                    key={conversation.conversationId}
                    type="button"
                    onClick={() => handleSelectConversation(conversation)}
                    disabled={loadingConversationId !== null}
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60"
                  >
                    <p className="text-sm font-semibold text-gray-800">
                      {conversation.title ||
                        `Hội thoại #${conversation.conversationId}`}
                    </p>

                    <span className="text-xs text-gray-500">
                      {loadingConversationId === conversation.conversationId
                        ? "Đang tải tin nhắn..."
                        : conversation.updatedAt
                          ? new Date(
                            conversation.updatedAt,
                          ).toLocaleString()
                          : ""}
                    </span>
                  </button>
                ))}
            </div>

            <div className="flex shrink-0 justify-end border-t border-gray-100 p-5 pt-3">
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