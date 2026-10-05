import { Sparkles } from "lucide-react";

const DEFAULT_SUGGESTIONS = [
  "Create a 3-day meal plan",
  "High-protein vegetarian meals",
  "What should I eat for dinner?",
  "Vegetarian grocery list",
  "Plant-based food substitutions",
];

function SuggestionChips({ onSelectSuggestion, disabled = false, suggestions = DEFAULT_SUGGESTIONS }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
        <Sparkles className="h-3 w-3 text-chaybook-primary" />
        <span>Suggestions</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-nowrap sm:flex-wrap">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled}
            onClick={() => onSelectSuggestion(suggestion)}
            className="shrink-0 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs sm:text-[13px] font-medium text-gray-700 hover:border-chaybook-primary hover:text-chaybook-primary hover:bg-emerald-50/50 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SuggestionChips;
