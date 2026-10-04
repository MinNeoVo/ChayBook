import { useState } from "react";
import AIHeader from "../components/ai/AIHeader";
import ChatMessageList from "../components/ai/ChatMessageList";
import ChatInput from "../components/ai/ChatInput";
import SuggestionChips from "../components/ai/SuggestionChips";
import { useAuth } from "../context/useAuth";
import { X, Check } from "lucide-react";
import { sendAIMessage } from "../services/aiAssistantService";

const INITIAL_MESSAGES = [
  {
    id: "msg-001",
    role: "user",
    content: "I would like to create a vegetarian meal plan for 3 days.",
    createdAt: "10:42 AM",
  },
  {
    id: "msg-002",
    role: "assistant",
    content: `Absolutely! Here's a balanced 3-day vegetarian meal plan.

DAY 1

Breakfast
Vegetarian banana oatmeal with chia seeds and flax.

Lunch
Chickpea salad with whole-grain toast and lemon tahini.

Dinner
Crispy tofu and vegetable stir-fry with fragrant brown rice.

DAY 2

Breakfast
Greek or coconut yogurt with wild blueberries and walnut granola.

Lunch
Hearty lentil stew with seeded whole-grain sourdough.

Dinner
Garlic shiitake mushroom bowl with brown rice and seasonal vegetables.

DAY 3

Breakfast
Mashed avocado toast with hemp hearts and a green matcha fruit smoothie.

Lunch
Tri-color quinoa bowl topped with roasted sweet potatoes and kale.

Dinner
Creamy golden chickpea curry with cucumber and fresh herbs.

Estimated daily nutrition:
Calories: ~1,890 kcal
Protein: ~78 g
Fiber: ~42 g`,
    createdAt: "Just now",
  },
];

function AIAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [lastUserPrompt, setLastUserPrompt] = useState("");

  // UI-only placeholders for Sessions & Diet Preferences
  const [activeModal, setActiveModal] = useState(null); // 'sessions' | 'preferences' | null

  const handleSendMessage = async (text) => {
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
      const aiMessage = await sendAIMessage(text);
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("AI Assistant error:", err);
      setError({
        message: "Unable to generate nutrition response. Please try again.",
        originalPrompt: text,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetry = () => {
    if (lastUserPrompt) {
      handleSendMessage(lastUserPrompt);
    }
  };

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
    setError(null);
    setIsTyping(false);
  };

  const handleClearAll = () => {
    setMessages([]);
    setError(null);
    setIsTyping(false);
  };

  return (
    <div className="w-full bg-chaybook-bg py-4 sm:py-6 lg:py-8 px-3 sm:px-6">
      <div className="mx-auto flex h-[calc(100vh-8.5rem)] min-h-[580px] max-w-[1040px] flex-col rounded-3xl border border-gray-200/80 bg-chaybook-container/40 p-3 sm:p-5 shadow-xs backdrop-blur-xs">
        {/* AI Top Header */}
        <AIHeader
          onReset={handleReset}
          onOpenHistory={() => setActiveModal("sessions")}
          onOpenPreferences={() => setActiveModal("preferences")}
        />

        {/* Action bar for testing / status */}
        <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-gray-500">
          <span>
            {messages.length} message{messages.length === 1 ? "" : "s"} in session
          </span>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              Clear conversation (test empty state)
            </button>
          )}
        </div>

        {/* Scrollable Conversation Stream */}
        <ChatMessageList
          messages={messages}
          isTyping={isTyping}
          error={error}
          onRetry={handleRetry}
          onSelectSuggestion={handleSendMessage}
          userName={user?.fullName || user?.name || "You"}
        />

        {/* Bottom Section: Input + Suggestion Chips */}
        <div className="mt-auto pt-3 border-t border-gray-200/60 flex flex-col gap-2.5">
          <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
          <SuggestionChips
            onSelectSuggestion={handleSendMessage}
            disabled={isTyping}
          />
        </div>
      </div>

      {/* UI-Only Modal: Recent Sessions */}
      {activeModal === "sessions" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Recent Sessions (UI Preview)
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="py-4 space-y-2">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <p className="text-sm font-semibold text-gray-800">
                  3-Day Vegetarian Meal Plan
                </p>
                <span className="text-xs text-gray-500">Today, 10:42 AM • Active</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 opacity-60">
                <p className="text-sm font-semibold text-gray-800">
                  High-Protein Plant Alternatives
                </p>
                <span className="text-xs text-gray-500">Yesterday • 14 messages</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Session persistence will be integrated with backend API in a later phase.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-chaybook-primary text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UI-Only Modal: Diet Preferences */}
      {activeModal === "preferences" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Diet Preferences (UI Preview)
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Vegetarian Diet Type
                  </p>
                  <span className="text-xs text-gray-500">Lacto-Ovo Vegetarian</span>
                </div>
                <Check className="h-4 w-4 text-chaybook-primary" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Nut &amp; Peanut Free
                  </p>
                  <span className="text-xs text-gray-500">Synched from profile</span>
                </div>
                <Check className="h-4 w-4 text-chaybook-primary" />
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Diet preference profile sync will be connected in a later phase.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-chaybook-primary text-white cursor-pointer"
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
