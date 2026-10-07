import { useEffect, useRef } from "react";
import UserMessage from "./UserMessage";
import AIMessage from "./AIMessage";
import TypingIndicator from "./TypingIndicator";
import EmptyChatState from "./EmptyChatState";
import { AlertCircle, RotateCcw } from "lucide-react";

function ChatMessageList({
  messages,
  isTyping,
  error,
  onRetry,
  onSelectSuggestion,
  userName = "You",
}) {
  const chatContainerRef = useRef(null);

  // Keep auto-scroll inside the conversation container, never the page.
  useEffect(() => {
    const chatContainer = chatContainerRef.current;

    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages, isTyping, error]);

  if (messages.length === 0 && !isTyping) {
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

            <span>
              {error.message || "Sorry, I couldn't process your request."}
            </span>
          </div>

          {onRetry && error.status !== 429 && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 font-semibold text-red-700 hover:text-red-900 underline cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Try again</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ChatMessageList;
