import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AIHeader from "../components/ai/AIHeader";
import ChatMessageList from "../components/ai/ChatMessageList";
import ChatInput from "../components/ai/ChatInput";
import SuggestionChips from "../components/ai/SuggestionChips";

import { useAuth } from "../context/useAuth";

import { Trash2, X, Crown, Zap } from "lucide-react";
import ProLockModal from "../components/common/ProLockModal";

import {
  sendAIMessage,
  getAIConversations,
  getAIConversationMessages,
  deleteAIConversationHistory,
  deleteAIConversation,
} from "../services/aiAssistantService";

function AIAssistantPage() {
  const { user, loading: isAuthLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [initialPrompt] = useState(() => {
    const promptFromState = location.state?.initialPrompt;
    return typeof promptFromState === "string" ? promptFromState.trim() : "";
  });
  const hasSentInitialPromptRef = useRef(false);

  // Lưu ID của cuộc hội thoại hiện đang mở
  const [conversationId, setConversationId] = useState(null);

  // Khởi tạo tin nhắn đầu tiên ngay nếu người dùng chuyển từ AiQuickAssistant ở HomePage sang
  const [messages, setMessages] = useState(() => {
    if (!initialPrompt) return [];
    const formattedTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return [
      {
        id: `user-init-${Date.now()}`,
        role: "user",
        content: initialPrompt,
        createdAt: formattedTime,
      },
    ];
  });
  const [conversations, setConversations] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [loadingConversationId, setLoadingConversationId] = useState(null);
  const [isTyping, setIsTyping] = useState(() => Boolean(initialPrompt));
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState(null);
  const [error, setError] = useState(null);
  const [lastUserPrompt, setLastUserPrompt] = useState(() => initialPrompt);
  const [guestTrialExhausted, setGuestTrialExhausted] = useState(false);
  const [userLimitExhausted, setUserLimitExhausted] = useState(false);
  const [userRemaining, setUserRemaining] = useState(null);
  const [showProModal, setShowProModal] = useState(false);

  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    if (!initialPrompt || isAuthLoading || hasSentInitialPromptRef.current) {
      return;
    }

    hasSentInitialPromptRef.current = true;
    navigate(location.pathname, { replace: true, state: null });

    sendAIMessage(initialPrompt, null)
      .then((aiMessage) => {
        if (aiMessage.conversationId != null) {
          setConversationId(aiMessage.conversationId);
        }

        setMessages((prev) => [...prev, aiMessage]);
        if (!user && aiMessage.guestQuestionsRemaining === 0) {
          setGuestTrialExhausted(true);
        }
        if (aiMessage.userQuestionsRemaining !== undefined) {
          setUserRemaining(aiMessage.userQuestionsRemaining);
          if (aiMessage.userQuestionsRemaining === 0) {
            setUserLimitExhausted(true);
          }
        }
      })
      .catch((err) => {
        console.error("AI Assistant error:", err);

        let errorMessage = "Không thể tạo câu trả lời. Vui lòng thử lại.";

        if (err.status === 429) {
          if (user) {
            errorMessage =
              "Bạn đã dùng hết 5 lượt hỏi miễn phí hôm nay. Vui lòng nâng cấp gói Pro để trò chuyện không giới hạn!";
            setUserLimitExhausted(true);
            setShowProModal(true);
          } else {
            errorMessage =
              "Bạn đã dùng hết 3 lượt hỏi dành cho khách. Vui lòng đăng nhập để tiếp tục sử dụng AI Assistant.";
            setGuestTrialExhausted(true);
          }
          setMessages((prev) =>
            prev.filter((message) => !String(message.id).startsWith("user-init-")),
          );
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
          originalPrompt: initialPrompt,
        });
      })
      .finally(() => {
        setIsTyping(false);
      });
  }, [initialPrompt, isAuthLoading, location.pathname, navigate, user]);

  const handleOpenHistory = async () => {
    if (isTyping) return;

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
    if (isTyping) return;

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

  const handleDeleteHistory = async () => {
    if (isDeletingHistory || conversations.length === 0) return;
    if (!window.confirm("Bạn có chắc muốn xóa toàn bộ lịch sử trò chuyện AI? Hành động này không thể hoàn tác.")) return;

    setIsDeletingHistory(true);
    setHistoryError("");
    try {
      await deleteAIConversationHistory();
      setConversations([]);
      setMessages([]);
      setConversationId(null);
      setError(null);
      setLastUserPrompt("");
    } catch (err) {
      setHistoryError(err.message || "Không thể xóa lịch sử hội thoại.");
    } finally {
      setIsDeletingHistory(false);
    }
  };

  const handleDeleteConversation = async (conversation) => {
    const id = conversation.conversationId;
    if (isDeletingHistory || deletingConversationId !== null || loadingConversationId !== null) return;
    if (!window.confirm(`Bạn có chắc muốn xóa cuộc trò chuyện “${conversation.title || `Hội thoại #${id}`}”?`)) return;

    setDeletingConversationId(id);
    setHistoryError("");
    try {
      await deleteAIConversation(id);
      setConversations((current) => current.filter((item) => item.conversationId !== id));
      if (conversationId === id) {
        setMessages([]);
        setConversationId(null);
        setError(null);
        setLastUserPrompt("");
      }
    } catch (err) {
      setHistoryError(err.message || "Không thể xóa cuộc hội thoại.");
    } finally {
      setDeletingConversationId(null);
    }
  };

  const handleSendMessage = async (text) => {
    if (
      !text ||
      !text.trim() ||
      isAuthLoading ||
      (!user && guestTrialExhausted)
    ) {
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
      if (!user && aiMessage.guestQuestionsRemaining === 0) {
        setGuestTrialExhausted(true);
      }
      if (aiMessage.userQuestionsRemaining !== undefined) {
        setUserRemaining(aiMessage.userQuestionsRemaining);
        if (aiMessage.userQuestionsRemaining === 0) {
          setUserLimitExhausted(true);
        }
      }
    } catch (err) {
      console.error("AI Assistant error:", err);

      let errorMessage = "Không thể tạo câu trả lời. Vui lòng thử lại.";

      if (err.status === 429) {
        if (user) {
          errorMessage =
            "Bạn đã dùng hết 5 lượt hỏi miễn phí hôm nay. Vui lòng nâng cấp gói Pro để trò chuyện không giới hạn!";
          setUserLimitExhausted(true);
          setShowProModal(true);
        } else {
          errorMessage =
            "Bạn đã dùng hết 3 lượt hỏi dành cho khách. Vui lòng đăng nhập để tiếp tục sử dụng AI Assistant.";
          setGuestTrialExhausted(true);
        }
        setMessages((prev) =>
          prev.filter((message) => message.id !== userMessage.id),
        );
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
    if (isTyping) return;

    // Bắt đầu hội thoại mới
    setMessages([]);
    setConversationId(null);
    setError(null);
    setIsTyping(false);
    setLastUserPrompt("");
  };

  const handleClearAll = () => {
    if (isTyping) return;

    // Xóa nội dung trên giao diện và bắt đầu hội thoại mới khi gửi tiếp
    setMessages([]);
    setConversationId(null);
    setError(null);
    setIsTyping(false);
    setLastUserPrompt("");
  };

  return (
    <div className="w-full bg-chaybook-bg px-3 py-3 sm:px-6 sm:py-6 lg:py-8">
      <div className="mx-auto flex h-[calc(100dvh-5.5rem)] min-h-[460px] max-w-[1040px] flex-col rounded-2xl border border-gray-200/80 bg-chaybook-container/40 p-3 shadow-xs backdrop-blur-xs sm:h-[calc(100vh-8.5rem)] sm:min-h-[580px] sm:rounded-3xl sm:p-5">
        {/* AI Header */}
        <AIHeader
          onReset={handleReset}
          onOpenHistory={handleOpenHistory}
          disabled={isTyping}
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
              disabled={isTyping}
              className="cursor-pointer text-gray-400 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
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
          guestTrialExhausted={!user && guestTrialExhausted}
          onRetry={handleRetry}
          onSelectSuggestion={handleSendMessage}
          userName={user?.fullName || user?.name || "You"}
        />

        {/* Input */}
        <div className="mt-auto flex flex-col gap-2.5 border-t border-gray-200/60 pt-3">
            {/* User Daily Quota Bar */}
            {user ? (
              user?.isPro ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50/80 border border-amber-200 px-3 py-1 rounded-full w-fit mx-auto">
                  <Crown className="h-3.5 w-3.5 text-amber-500" /> Thành viên Pro: Hỏi đáp không giới hạn
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-xl">
                  <span>
                    Hôm nay:{" "}
                    <strong>
                      {userRemaining != null ? `${userRemaining}/5 câu hỏi còn lại` : "5 câu hỏi / 1 ngày"}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowProModal(true)}
                    className="inline-flex items-center gap-1 font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5" /> Nâng cấp Pro không giới hạn
                  </button>
                </div>
              )
            ) : null}

            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={isAuthLoading || isTyping || (!user && guestTrialExhausted) || (user && userLimitExhausted)}
            />

            <SuggestionChips
              onSelectSuggestion={handleSendMessage}
              disabled={isAuthLoading || isTyping || (!user && guestTrialExhausted) || (user && userLimitExhausted)}
            />
        </div>
      </div>

      {/* Pro Lock Modal */}
      <ProLockModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        featureName="hỏi đáp Chatbot AI không giới hạn"
        customMessage="Bạn đã sử dụng hết 5 câu hỏi miễn phí trong ngày hôm nay. Hãy nâng cấp gói Pro để trò chuyện thoải mái không giới hạn và mở khóa tất cả tính năng AI!"
      />

      {/* =========================
          HISTORY MODAL
          ========================= */}
      {activeModal === "sessions" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs">
          <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-5 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Lịch sử cuộc hội thoại
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
                  <div
                    key={conversation.conversationId}
                    className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-2 transition-colors hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectConversation(conversation)}
                      disabled={isTyping || loadingConversationId !== null || isDeletingHistory || deletingConversationId !== null}
                      className="min-w-0 flex-1 cursor-pointer p-1 text-left disabled:cursor-wait disabled:opacity-60"
                    >
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {conversation.title || `Hội thoại #${conversation.conversationId}`}
                      </p>
                      <span className="text-xs text-gray-500">
                        {loadingConversationId === conversation.conversationId
                          ? "Đang tải tin nhắn..."
                          : conversation.updatedAt
                            ? new Date(conversation.updatedAt).toLocaleString("vi-VN")
                            : ""}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteConversation(conversation)}
                      disabled={isTyping || loadingConversationId !== null || isDeletingHistory || deletingConversationId !== null}
                      aria-label={`Xóa hội thoại ${conversation.title || conversation.conversationId}`}
                      title="Xóa cuộc trò chuyện"
                      className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {deletingConversationId === conversation.conversationId
                        ? <span className="text-xs">...</span>
                        : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                ))}
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-gray-100 p-5 pt-3">
              <button
                type="button"
                onClick={handleDeleteHistory}
                disabled={isDeletingHistory || isHistoryLoading || conversations.length === 0}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeletingHistory ? "Đang xóa..." : "Xóa toàn bộ lịch sử"}
              </button>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                disabled={isDeletingHistory}
                className="cursor-pointer rounded-xl bg-chaybook-primary px-4 py-2 text-xs font-semibold text-white"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AIAssistantPage;
