import { useState, useRef, useEffect } from "react";
import { Send, Plus } from "lucide-react";

function ChatInput({ onSendMessage, disabled = false }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  // Auto-resize textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [text]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const isSendDisabled = disabled || !text.trim();

  return (
    <div className="w-full">
      <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2 sm:p-2.5 shadow-sm transition-all focus-within:border-chaybook-primary focus-within:ring-2 focus-within:ring-chaybook-primary/20">
        {/* Plus / Action Icon button */}
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:text-chaybook-primary hover:bg-emerald-50 transition-colors cursor-pointer"
          title="Add attachment or prompt context (UI preview)"
          aria-label="Add prompt options"
        >
          <Plus className="h-5 w-5" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about food, substitutions, meal prep, or calories..."
          aria-label="Ask about food, substitutions, meal prep, or calories"
          rows={1}
          disabled={disabled}
          className="max-h-[140px] min-h-[38px] w-full resize-none bg-transparent py-2 px-1 text-sm sm:text-base text-gray-800 placeholder:text-gray-400 outline-none leading-relaxed"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={isSendDisabled}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chaybook-primary text-white shadow-xs transition-all hover:bg-chaybook-hover active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-chaybook-primary cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-1.5 flex items-center justify-between px-2 text-[11px] text-gray-400">
        <span className="hidden sm:inline">
          Use <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px] text-gray-600">Enter</kbd> to send, <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px] text-gray-600">Shift + Enter</kbd> for new line
        </span>
        <span className="ml-auto text-gray-400 font-medium">
          ChayBook AI • Plant Nutrition
        </span>
      </div>
    </div>
  );
}

export default ChatInput;
