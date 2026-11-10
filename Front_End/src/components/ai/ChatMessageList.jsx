import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import UserMessage from "./UserMessage";
import AIMessage from "./AIMessage";
import TypingIndicator from "./TypingIndicator";
import EmptyChatState from "./EmptyChatState";
import { AlertCircle, RotateCcw } from "lucide-react";

function ChatMessageList({
  messages,
  isTyping,
  error,
  guestTrialExhausted = false,
  onRetry,
  onSelectSuggestion,
  userName = "Bạn",
}) {
  const chatContainerRef = useRef(null);

  // Keep auto-scroll inside the conversation container, never the page.
  useEffect(() => {
    const chatContainer = chatContainerRef.current;

    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages, isTyping, error]);

  if (messages.length === 0 && !isTyping && !error && !guestTrialExhausted) {
    return (
      <div
        ref={chatContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-8"
      >
        <EmptyChatState onSelectSuggestion={onSelectSuggestion} />
      </div>
    );
  }

  return (
    <div
      ref={chatContainerRef}
      className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-6 space-y-6 scroll-smooth"
    >
      {messages.map((message) => {
        if (message.role === "user") {
          return (
            <UserMessage
              key={message.id}
              message={message}
              userName={userName}
            />
          );
        }
        return <AIMessage key={message.id} message={message} />;
      })}

      {/* Typing state */}
      {isTyping && <TypingIndicator />}

      {/* Simulated Error State Banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />

            <div>
              <span>
                {error.message || "Xin lỗi, hiện chưa thể xử lý yêu cầu của bạn."}
              </span>
              {error.status === 429 && (
                <Link
                  to="/login"
                  className="ml-2 inline-flex font-semibold underline hover:text-red-900"
                >
                  Đăng nhập ngay
                </Link>
              )}
            </div>
          </div>

          {onRetry && error.status !== 429 && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 font-semibold text-red-700 hover:text-red-900 underline cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Thử lại</span>
            </button>
          )}
        </div>
      )}

      {guestTrialExhausted && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <span>Bạn đã dùng hết 3 lượt hỏi dành cho khách.</span>
          <Link
            to="/login"
            className="ml-2 inline-flex font-semibold underline hover:text-amber-950"
          >
            Đăng nhập để tiếp tục
          </Link>
        </div>
      )}
    </div>
  );
}

export default ChatMessageList;
