import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChefHat,
  CircleAlert,
  Clock3,
  RefreshCcw,
  Utensils,
} from "lucide-react";

import RecipeImage from "../components/recipes/RecipeImage";
import Button from "../components/common/Button";
import { getRecipeById } from "../services/recipeServices";

function formatMinutes(minutes) {
  if (typeof minutes !== "number" || !Number.isFinite(minutes)) {
    return null;
  }

  return `${minutes} min`;
}

function formatQuantity(quantity) {
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
    return null;
  }

  return String(quantity);
}

function RecipeDetailLoading() {
  return (
    <div aria-label="Loading recipe" aria-live="polite" className="space-y-8">
      <div className="h-6 w-36 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-8 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm md:grid-cols-2 md:p-8">
        <div className="aspect-4/3 animate-pulse rounded-xl bg-gray-200" />
        <div className="space-y-5 py-2">
          <div className="h-8 w-4/5 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
          <div className="h-16 w-full animate-pulse rounded bg-gray-100" />
        </div>
      </div>
      <div className="h-40 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

function RecipeDetailStatus({ isNotFound, onRetry }) {
  return (
    <section
      role="alert"
      className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-gray-200/80 bg-white px-6 py-12 text-center shadow-sm"
    >
      <CircleAlert
        aria-hidden="true"
        size={42}
        className={`mb-4 ${isNotFound ? "text-[#6e7b6c]" : "text-red-600"}`}
      />
      <h1 className="mb-2 text-2xl font-semibold text-[#181c1b]">
        {isNotFound ? "Recipe not found." : "Unable to load this recipe."}
      </h1>
      {!isNotFound && (
        <p className="mb-5 text-sm text-[#3e4a3d]">Please try again.</p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {isNotFound ? (
          <Link
            to="/recipes"
            className="inline-flex items-center gap-2 rounded-xl bg-chaybook-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-chaybook-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chaybook-primary focus-visible:ring-offset-2"
          >
            <ArrowLeft aria-hidden="true" size={17} />
            Back to Recipes
          </Link>
        ) : (
          <Button type="button" onClick={onRetry}>
            <span className="inline-flex items-center gap-2">
              <RefreshCcw aria-hidden="true" size={16} />
              Try Again
            </span>
          </Button>
        )}
        {!isNotFound && (
          <Link
            to="/recipes"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-chaybook-primary transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chaybook-primary focus-visible:ring-offset-2"
          >
            <ArrowLeft aria-hidden="true" size={17} />
            Back to Recipes
          </Link>
        )}
      </div>
    </section>
  );
}

function RecipeDetailPage() {
  const { recipeId } = useParams();
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${recipeId}:${retryCount}`;
  const [result, setResult] = useState({
    requestKey: null,
    status: "loading",
    recipe: null,
    errorStatus: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    getRecipeById(recipeId, { signal: controller.signal })
      .then((data) => {
        setResult({
          requestKey,
          status: "success",
          recipe: data,
          errorStatus: null,
        });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResult({
            requestKey,
            status: "error",
            recipe: null,
            errorStatus: error.status ?? "request-error",
          });
        }
      });

    return () => controller.abort();
  }, [recipeId, requestKey]);

  const isCurrentResult = result.requestKey === requestKey;
  const isLoading = !isCurrentResult;
  const recipe = isCurrentResult ? result.recipe : null;
  const errorStatus = isCurrentResult ? result.errorStatus : null;

  if (isLoading) {
    return (
      <main className="min-h-screen w-full bg-chaybook-container font-sans text-[#181c1b] antialiased">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-12 lg:py-14">
          <RecipeDetailLoading />
        </div>
      </main>
    );
  }

  if (errorStatus !== null || !recipe) {
    return (
      <main className="min-h-screen w-full bg-chaybook-container font-sans text-[#181c1b] antialiased">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-12 lg:py-14">
          <RecipeDetailStatus
            isNotFound={errorStatus === 404}
            onRetry={() => setRetryCount((count) => count + 1)}
          />
        </div>
      </main>
    );
  }

  const prepTime = formatMinutes(recipe.prepTime);
  const cookTime = formatMinutes(recipe.cookTime);
  const totalTime =
    prepTime !== null && cookTime !== null
      ? formatMinutes(recipe.prepTime + recipe.cookTime)
      : null;
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];

  return (
    <main className="min-h-screen w-full bg-chaybook-container font-sans text-[#181c1b] antialiased">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-12 lg:py-14">
        <Link
          to="/recipes"
          className="mb-6 inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold text-chaybook-primary transition-colors hover:text-chaybook-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chaybook-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft aria-hidden="true" size={18} />
          Back to Recipes
        </Link>

        <section className="grid grid-cols-1 gap-7 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-2 md:gap-9 md:p-8">
          <RecipeImage
            imageUrl={recipe.imageUrl}
            alt={recipe.name ? `${recipe.name} recipe` : "Recipe"}
            className="aspect-4/3 w-full rounded-xl md:aspect-auto md:min-h-80"
          />

          <div className="flex min-w-0 flex-col justify-center py-2 md:py-4">
            <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#e7f5e9] px-3 py-1 text-xs font-semibold text-chaybook-primary">
              <ChefHat aria-hidden="true" size={15} />
              Recipe
            </span>
            <h1 className="mb-4 text-2xl font-bold leading-tight tracking-tight text-[#181c1b] sm:text-3xl lg:text-4xl">
              {recipe.name || "Recipe"}
            </h1>
            {recipe.description && (
              <p className="mb-6 text-sm leading-7 text-[#3e4a3d] sm:text-base">
                {recipe.description}
              </p>
            )}

            {(prepTime || cookTime || totalTime) && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {prepTime && (
                  <div className="rounded-xl border border-gray-200 bg-[#f7faf7] p-4">
                    <span className="mb-2 flex items-center gap-2 text-xs font-medium text-[#6e7b6c]">
                      <Clock3 aria-hidden="true" size={16} />
                      Prep Time
                    </span>
                    <span className="text-base font-semibold text-[#181c1b]">
                      {prepTime}
                    </span>
                  </div>
                )}
                {cookTime && (
                  <div className="rounded-xl border border-gray-200 bg-[#f7faf7] p-4">
                    <span className="mb-2 flex items-center gap-2 text-xs font-medium text-[#6e7b6c]">
                      <ChefHat aria-hidden="true" size={16} />
                      Cook Time
                    </span>
                    <span className="text-base font-semibold text-[#181c1b]">
                      {cookTime}
                    </span>
                  </div>
                )}
                {totalTime && (
                  <div className="col-span-2 rounded-xl border border-[#cfe4d3] bg-[#e7f5e9] p-4 sm:col-span-1">
                    <span className="mb-2 flex items-center gap-2 text-xs font-medium text-chaybook-primary">
                      <Clock3 aria-hidden="true" size={16} />
                      Total Time
                    </span>
                    <span className="text-base font-semibold text-[#181c1b]">
                      {totalTime}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <section
            aria-labelledby="ingredients-heading"
            className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-7 lg:col-span-5"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f5e9] text-chaybook-primary">
                <Utensils aria-hidden="true" size={20} />
              </span>
              <div>
                <h2
                  id="ingredients-heading"
                  className="text-xl font-bold text-[#181c1b]"
                >
                  Ingredients
                </h2>
                <p className="mt-0.5 text-xs text-[#6e7b6c]">
                  {ingredients.length} ingredients
                </p>
              </div>
            </div>

            {ingredients.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {ingredients.map((ingredient) => {
                  const quantity = formatQuantity(ingredient.quantity);

                  return (
                    <li
                      key={ingredient.ingredientId}
                      className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                    >
                      <span className="min-w-0 text-sm font-medium text-[#28312b]">
                        {ingredient.name}
                      </span>
                      {(quantity || ingredient.unit) && (
                        <span className="shrink-0 rounded-lg bg-[#f1f4f1] px-3 py-1.5 text-sm font-semibold text-chaybook-primary">
                          {[quantity, ingredient.unit]
                            .filter(Boolean)
                            .join(" ")}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl bg-[#f7faf7] px-4 py-5 text-sm text-[#6e7b6c]">
                No ingredients are available for this recipe.
              </p>
            )}
          </section>

          <section
            aria-labelledby="instructions-heading"
            className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-7 lg:col-span-7"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f5e9] text-chaybook-primary">
                <ChefHat aria-hidden="true" size={21} />
              </span>
              <h2
                id="instructions-heading"
                className="text-xl font-bold text-[#181c1b]"
              >
                Instructions
              </h2>
            </div>
            {recipe.instructions ? (
              <div className="whitespace-pre-line rounded-xl bg-[#f7faf7] p-4 text-sm leading-7 text-[#3e4a3d] sm:p-5">
                {recipe.instructions}
              </div>
            ) : (
              <p className="rounded-xl bg-[#f7faf7] px-4 py-5 text-sm text-[#6e7b6c]">
                No instructions are available for this recipe.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default RecipeDetailPage;
