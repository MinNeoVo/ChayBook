import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock3, Flame, Leaf, Sparkles } from "lucide-react";

import AllergySelector from "../components/allergy/AllergySelector";
import BmiCalculator from "../components/bmi/BmiCalculator";
import Button from "../components/common/Button";
import RecipeImage from "../components/recipes/RecipeImage";
import { useBmi } from "../context/useBmi";
import { createMealPlan, getMealPlans } from "../services/mealPlanServices";
import { formatBmiValue, getBmiCategoryLabel } from "../utils/bmi";

 

const mealLabels = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

const goalOptions = [
  { value: "WEIGHT_LOSS", label: "Weight loss" },
  { value: "MAINTAIN", label: "Maintain current weight" },
  { value: "WEIGHT_GAIN", label: "Weight gain" },
];

function MealPlanPage() {
  const { bmiRecord, initialized: bmiInitialized } = useBmi();
  const allergySelectorRef = useRef(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
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
        setSelectedPlanId(savedPlans[0]?.mealPlanId ?? null);
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
    selectedPlan.items.forEach((item) => {
      const dayItems = grouped.get(item.dayNumber) ?? [];
      dayItems.push(item);
      grouped.set(item.dayNumber, dayItems);
    });
    return [...grouped.entries()].sort(([dayA], [dayB]) => dayA - dayB);
  }, [selectedPlan]);

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
    <div className="w-full bg-chaybook-container px-4 py-10 text-[#181c1b] sm:px-6 sm:py-14 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="max-w-3xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-chaybook-primary">
            Your nutrition workspace
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Meal Plan</h1>
          <p className="mt-3 text-sm leading-6 text-[#3e4a3d]">
            Save your BMI, choose a goal and build a multi-day menu from recipes
            in ChayBook. The plan uses the BMI record and nutrition values stored
            with each recipe.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">Your latest BMI</h2>
            <BmiCalculator />
          </div>

          <section className="rounded-2xl bg-white p-6 shadow-md md:p-8">
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

        <section className="flex flex-col gap-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-chaybook-primary">
                Saved menus
              </p>
              <h2 className="text-2xl font-bold">Your meal plans</h2>
            </div>
            {plans.length > 0 && (
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 sm:min-w-64">
                Select a saved plan
                <select
                  value={selectedPlanId ?? ""}
                  onChange={(event) => setSelectedPlanId(Number(event.target.value))}
                  className="h-11 rounded-xl border border-gray-300 bg-white px-3 font-normal"
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
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl bg-white p-5 text-sm text-gray-700 shadow-sm">
                <span className="flex items-center gap-2 font-semibold text-chaybook-primary">
                  <CalendarDays className="h-4 w-4" /> {selectedPlan.durationDays} days
                </span>
                <span>Goal: {selectedPlan.healthGoal.replaceAll("_", " ").toLowerCase()}</span>
                {selectedPlan.bmi && (
                  <span>BMI: {formatBmiValue(selectedPlan.bmi.bmi)} · {getBmiCategoryLabel(selectedPlan.bmi.category)}</span>
                )}
              </div>

              {days.map(([dayNumber, items]) => (
                <section key={dayNumber} className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
                  <h3 className="mb-4 text-lg font-bold">Day {dayNumber}</h3>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                      <article key={`${dayNumber}-${item.mealType}`} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                        <RecipeImage
                          imageUrl={item.recipe.imageUrl}
                          alt={item.recipe.name}
                          className="h-40 w-full"
                        />
                        <div className="flex flex-col gap-3 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase tracking-wide text-chaybook-primary">
                              {mealLabels[item.mealType] ?? item.mealType}
                            </span>
                            <Link
                              to={`/recipes/${item.recipe.recipeId}`}
                              className="text-xs font-semibold text-chaybook-primary hover:underline"
                            >
                              View recipe
                            </Link>
                          </div>
                          <h4 className="text-base font-bold text-gray-900">{item.recipe.name}</h4>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Flame className="h-4 w-4 text-orange-500" />
                            {Math.round(item.recipe.calories)} kcal
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                            <span>Protein<br /><strong>{item.recipe.protein ?? "—"} g</strong></span>
                            <span>Carbs<br /><strong>{item.recipe.carbs ?? "—"} g</strong></span>
                            <span>Fat<br /><strong>{item.recipe.fat ?? "—"} g</strong></span>
                          </div>
                          {(item.recipe.prepTime || item.recipe.cookTime) && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock3 className="h-3.5 w-3.5" />
                              {(item.recipe.prepTime ?? 0) + (item.recipe.cookTime ?? 0)} min
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
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
