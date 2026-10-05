import { Sprout } from "lucide-react";

function EmptyChatState({ onSelectSuggestion }) {
  const starterPrompts = [
    {
      title: "Create a 3-day meal plan",
      desc: "Balanced plant-based meals with daily nutrition targets",
    },
    {
      title: "High-protein vegetarian meals",
      desc: "Tofu, tempeh, legume, and seed combinations",
    },
    {
      title: "What should I eat for dinner?",
      desc: "Quick, wholesome vegetarian recipes for tonight",
    },
    {
      title: "Vegetarian grocery list",
      desc: "Pantry staples and seasonal produce essentials",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center max-w-lg mx-auto">
      {/* Botanical Icon Circle */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-chaybook-primary border border-emerald-100 shadow-xs">
        <Sprout className="h-8 w-8" />
      </div>

      <h2 className="text-xl font-bold text-gray-900 tracking-tight">
        AI Nutrition Assistant
      </h2>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-chaybook-primary">
        ChayBot • Plant-First Guidance
      </p>

      <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-md">
        Ask me about vegetarian nutrition, recipes, meal planning, food
        substitutions, or meal preparation.
      </p>

      {/* Starter Prompts Grid */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {starterPrompts.map((prompt) => (
          <button
            key={prompt.title}
            type="button"
            onClick={() => onSelectSuggestion(prompt.title)}
            className="flex flex-col items-start p-3.5 rounded-xl border border-gray-200 bg-white hover:border-chaybook-primary hover:bg-emerald-50/40 text-left transition-all shadow-2xs group cursor-pointer"
          >
            <span className="text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-chaybook-primary">
              {prompt.title}
            </span>
            <span className="mt-1 text-xs text-gray-500 line-clamp-2">
              {prompt.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default EmptyChatState;
