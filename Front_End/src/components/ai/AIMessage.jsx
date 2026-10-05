import { Sprout } from "lucide-react";

function AIMessage({ message }) {
  return (
    <div className="flex items-start gap-2.5 sm:gap-3.5 pr-4 sm:pr-12">
      {/* Bot Avatar */}
      <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-chaybook-primary text-white shadow-xs">
        <Sprout className="h-5 w-5" />
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {/* Assistant Header & Meta */}
        <div className="flex items-center gap-2 px-1 text-xs">
          <span className="font-semibold text-gray-900">
            AI Nutrition Assistant
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            ChayBot
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-400">
            {message.createdAt || "Just now"}
          </span>
        </div>

        {/* AI Plain Text Content Box */}
        <div className="rounded-2xl rounded-tl-xs bg-white p-4 sm:p-5 border border-gray-100 shadow-xs">
          <div className="whitespace-pre-wrap break-words text-sm sm:text-[15px] leading-relaxed text-gray-800 font-normal">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIMessage;
