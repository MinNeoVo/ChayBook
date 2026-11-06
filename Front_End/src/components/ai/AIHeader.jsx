import { History, SlidersHorizontal, RotateCcw } from "lucide-react";

function AIHeader({ onReset, onOpenHistory, onOpenPreferences }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 sm:px-6 rounded-2xl border border-gray-100 shadow-xs">
      {/* Left: Bot Identity & Status */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <span className="h-3 w-3 rounded-full bg-chaybook-primary animate-pulse" />
          <span className="absolute h-3 w-3 rounded-full bg-chaybook-primary/30 animate-ping" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            AI Nutrition Assistant
          </h1>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-chaybook-primary border border-emerald-100">
            ChayBot v2.4
          </span>
        </div>

        <span className="hidden md:inline-block text-xs text-gray-400">•</span>
        <span className="hidden md:inline-block text-xs font-medium text-gray-500">
          Plant-first clinical guidance
        </span>
      </div>

      {/* Right: UI-Only Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onOpenHistory}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-chaybook-primary hover:bg-chaybook-bg transition-colors cursor-pointer"
          title="Recent Sessions (UI preview)"
        >
          <History className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Recent Sessions</span>
        </button>

        <button
          type="button"
          onClick={onOpenPreferences}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-chaybook-primary hover:bg-chaybook-bg transition-colors cursor-pointer"
          title="Diet Preferences (UI preview)"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Diet Preferences</span>
        </button>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Reset to default conversation"
            aria-label="Reset conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default AIHeader;
