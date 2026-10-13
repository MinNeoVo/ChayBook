import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { CalendarDays, Leaf, Sparkles } from "lucide-react";

import AllergySelector from "../components/allergy/AllergySelector";
import BmiCalculator from "../components/bmi/BmiCalculator";
import Button from "../components/common/Button";
import MealPlanSchedule from "../components/mealplan/MealPlanSchedule";
import { useBmi } from "../context/useBmi";
import { createMealPlan, getMealPlans } from "../services/mealPlanServices";
import { formatBmiValue, getBmiCategoryLabel } from "../utils/bmi";

const goalOptions = [
  { value: "WEIGHT_LOSS", label: "Weight loss" },
  { value: "MAINTAIN", label: "Maintain current weight" },
  { value: "WEIGHT_GAIN", label: "Weight gain" },
];

function MealPlanPage() {
  const location = useLocation();
  const [returnPlan, setReturnPlan] = useState(() => location.state);
  const { bmiRecord, initialized: bmiInitialized } = useBmi();
  const allergySelectorRef = useRef(null);
  const mealPlanTableRef = useRef(null);
  const hasScrolledToPlanRef = useRef(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(returnPlan?.mealPlanId ?? null);
  const [healthGoal, setHealthGoal] = useState("MAINTAIN");
  const [durationDays, setDurationDays] = useState(7);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [allergyStatus, setAllergyStatus] = useState({
    ready: false,
    loading: true,
    saving: false,
    isDirty: false,
  });

  useEffect(() => {
    const controller = new AbortController();

    getMealPlans({ signal: controller.signal })
      .then((savedPlans) => {
        setPlans(savedPlans);
        setSelectedPlanId((currentId) =>
          savedPlans.some((plan) => plan.mealPlanId === currentId)
            ? currentId
            : savedPlans[0]?.mealPlanId ?? null,
        );
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          console.error("Failed to load meal plans:", requestError);
          setError(requestError.message || "Could not load saved meal plans.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingPlans(false);
        }
      });

    return () => controller.abort();
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.mealPlanId === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const days = useMemo(() => {
    if (!selectedPlan) return [];
    const grouped = new Map();
    // Keep days with missing meals visible instead of collapsing the calendar.
    if (Number.isInteger(selectedPlan.durationDays) && selectedPlan.durationDays > 0) {
      for (let dayNumber = 1; dayNumber <= selectedPlan.durationDays; dayNumber += 1) {
        grouped.set(dayNumber, []);
      }
    }
    (selectedPlan.items ?? []).forEach((item) => {
      const dayItems = grouped.get(item.dayNumber) ?? [];
      dayItems.push(item);
      grouped.set(item.dayNumber, dayItems);
    });
    return [...grouped.entries()].sort(([dayA], [dayB]) => dayA - dayB);
  }, [selectedPlan]);

  useEffect(() => {
    if (
      !returnPlan?.scrollToMealPlan ||
      loadingPlans ||
      allergyStatus.loading ||
      !bmiInitialized ||
      !selectedPlan ||
      hasScrolledToPlanRef.current
    ) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const table = mealPlanTableRef.current;
      if (!table) return;

      const navbar = table.closest("main")?.parentElement?.querySelector(":scope > header");
      const navbarHeight = navbar?.getBoundingClientRect().height ?? 0;
      window.scrollTo({
        top: window.scrollY + table.getBoundingClientRect().top - navbarHeight,
        behavior: "instant",
      });
      hasScrolledToPlanRef.current = true;
    });

    return () => cancelAnimationFrame(frame);
  }, [returnPlan, loadingPlans, allergyStatus.loading, bmiInitialized, selectedPlan]);

  async function handleGenerate(event) {
    event.preventDefault();
    setError("");
    setGenerating(true);

    try {
      if (!allergyStatus.ready || allergyStatus.loading || allergyStatus.saving) {
        throw new Error("Wait for your allergy preferences to finish loading or saving.");
      }
      if (allergyStatus.isDirty) {
        await allergySelectorRef.current.save();
      }

      const plan = await createMealPlan({ healthGoal, durationDays });
      setReturnPlan(null);
      setPlans((current) => [plan, ...current]);
      setSelectedPlanId(plan.mealPlanId);
    } catch (requestError) {
      console.error("Failed to generate meal plan:", requestError);
      setError(requestError.message || "Could not generate your meal plan.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="w-full min-w-0 bg-chaybook-container px-4 py-10 text-[#181c1b] sm:px-6 sm:py-14 lg:px-12">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-10">
        <header className="max-w-3xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-chaybook-primary">
            Your nutrition workspace
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Meal Plan</h1>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            <h2 className="text-xl font-bold">Your latest BMI</h2>
            <BmiCalculator />
          </div>

          <section className="min-w-0 rounded-2xl bg-white p-6 shadow-md md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chaybook-secondary-container text-chaybook-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Create a plan</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Choose a goal and how many days to plan.
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-semibold text-gray-800">
                Health goal
                <select
                  value={healthGoal}
                  onChange={(event) => setHealthGoal(event.target.value)}
                  className="h-12 rounded-xl border border-gray-300 bg-white px-3 font-normal outline-none focus:border-chaybook-primary focus:ring-2 focus:ring-chaybook-primary/15"
                >
                  {goalOptions.map((goal) => (
                    <option key={goal.value} value={goal.value}>
                      {goal.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-gray-800">
                Plan duration
                <select
                  value={durationDays}
                  onChange={(event) => setDurationDays(Number(event.target.value))}
                  className="h-12 rounded-xl border border-gray-300 bg-white px-3 font-normal outline-none focus:border-chaybook-primary focus:ring-2 focus:ring-chaybook-primary/15"
                >
                  {[3, 7, 14].map((daysCount) => (
                    <option key={daysCount} value={daysCount}>
                      {daysCount} days
                    </option>
                  ))}
                </select>
              </label>

              <AllergySelector
                ref={allergySelectorRef}
                disabled={generating}
                onStatusChange={setAllergyStatus}
              />

              {!bmiInitialized && (
                <p className="text-sm text-gray-600">Loading your BMI…</p>
              )}
              {bmiInitialized && !bmiRecord && (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                  Calculate and save your BMI above before creating a meal plan.
                </p>
              )}

              <Button
                type="submit"
                disabled={
                  generating ||
                  !bmiInitialized ||
                  !bmiRecord ||
                  !allergyStatus.ready ||
                  allergyStatus.loading ||
                  allergyStatus.saving
                }
                className="mt-1 h-12 gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {generating ? "Building your plan…" : "Generate meal plan"}
              </Button>
            </form>

            <div className="mt-5 flex gap-3 rounded-xl bg-chaybook-container p-4 text-sm leading-6 text-gray-700">
              <Leaf className="mt-0.5 h-5 w-5 shrink-0 text-chaybook-primary" />
              <p>
                Recipes are filtered using your saved allergies. Vegetarian or
                vegan labels are not currently available in the recipe data, so
                those preferences are not filtered.
              </p>
            </div>
          </section>
        </section>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <section className="flex min-w-0 flex-col gap-5">
          <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-chaybook-primary">
                Saved menus
              </p>
              <h2 className="text-2xl font-bold">Your meal plans</h2>
            </div>
            {plans.length > 0 && (
              <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-gray-700 sm:w-72 sm:shrink-0">
                Select a saved plan
                <select
                  value={selectedPlanId ?? ""}
                  onChange={(event) => {
                    setReturnPlan(null);
                    setSelectedPlanId(Number(event.target.value));
                  }}
                  className="h-11 w-full min-w-0 max-w-full rounded-xl border border-gray-300 bg-white px-3 font-normal"
                >
                  {plans.map((plan) => (
                    <option key={plan.mealPlanId} value={plan.mealPlanId}>
                      {new Date(plan.generatedAt).toLocaleDateString()} · {plan.durationDays} days · {plan.healthGoal.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {loadingPlans ? (
            <p className="rounded-2xl bg-white p-6 text-sm text-gray-600 shadow-sm">
              Loading your saved meal plans…
            </p>
          ) : selectedPlan ? (
            <div className="flex min-w-0 flex-col gap-5">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl bg-white p-5 text-sm text-gray-700 shadow-sm">
                <span className="flex items-center gap-2 font-semibold text-chaybook-primary">
                  <CalendarDays className="h-4 w-4" /> {selectedPlan.durationDays} days
                </span>
                <span>Goal: {selectedPlan.healthGoal.replaceAll("_", " ").toLowerCase()}</span>
                {selectedPlan.bmi && (
                  <span>BMI: {formatBmiValue(selectedPlan.bmi.bmi)} · {getBmiCategoryLabel(selectedPlan.bmi.category)}</span>
                )}
              </div>

              <MealPlanSchedule
                key={selectedPlan.mealPlanId}
                days={days}
                mealPlanId={selectedPlan.mealPlanId}
                tableRef={mealPlanTableRef}
                initialPage={returnPlan?.mealPlanId === selectedPlan.mealPlanId ? returnPlan.mealPlanPage : 0}
              />
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <CalendarDays className="mx-auto mb-3 h-9 w-9 text-chaybook-primary" />
              <h3 className="text-lg font-bold">No saved meal plan yet</h3>
              <p className="mt-2 text-sm text-gray-600">
                Save your BMI, then generate a plan to see meals here.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default MealPlanPage;
