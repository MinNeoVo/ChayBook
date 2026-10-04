import { Sprout } from "lucide-react";

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 sm:gap-3.5 pr-4 sm:pr-12">
      {/* Bot Avatar */}
      <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-chaybook-primary text-white shadow-xs">
        <Sprout className="h-5 w-5" />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 px-1 text-xs">
          <span className="font-semibold text-gray-900">
            AI Nutrition Assistant
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-400">Thinking...</span>
        </div>

        {/* Typing Dots Bubble */}
        <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-xs bg-white px-4 py-3 border border-gray-100 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-chaybook-primary/70 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-chaybook-primary/70 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-chaybook-primary/70 animate-bounce" />
          <span className="ml-1.5 text-xs text-gray-500 font-medium">ChayBot is composing guidance</span>
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
