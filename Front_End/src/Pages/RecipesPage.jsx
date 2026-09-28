import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChefHat,
  CircleAlert,
  Clock3,
  RefreshCcw,
  Search,
} from "lucide-react";

import RecipeImage from "../components/recipes/RecipeImage";
import Button from "../components/common/Button";
import {
  DEFAULT_RECIPE_CATEGORY_ID,
  getRecipes,
} from "../services/recipeServices";

function formatMinutes(minutes) {
  if (typeof minutes !== "number" || !Number.isFinite(minutes)) {
    return null;
  }

  return `${minutes} min`;
}

function RecipeCard({ recipe }) {
  const prepTime = formatMinutes(recipe.prepTime);
  const cookTime = formatMinutes(recipe.cookTime);
  const hasTotalTime = prepTime !== null && cookTime !== null;
  const totalTime = hasTotalTime
    ? formatMinutes(recipe.prepTime + recipe.cookTime)
    : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        to={`/recipes/${recipe.recipeId}`}
        aria-label={`View recipe: ${recipe.name || "Recipe"}`}
        className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chaybook-primary"
      >
        <div className="relative aspect-16/10 overflow-hidden bg-chaybook-container">
          <RecipeImage
            imageUrl={recipe.imageUrl}
            alt={recipe.name ? `${recipe.name} recipe` : "Recipe"}
            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-chaybook-primary shadow-sm backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-chaybook-primary" />
            Recipe
          </span>
          {totalTime && (
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-[#2d3130]/85 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <Clock3 aria-hidden="true" size={14} />
              {totalTime} total
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h2 className="mb-2 line-clamp-2 text-lg font-semibold leading-6 text-[#181c1b] transition-colors group-hover:text-chaybook-primary">
            {recipe.name || "Untitled recipe"}
          </h2>
          <p className="mb-5 line-clamp-3 text-sm leading-6 text-[#3e4a3d]">
            {recipe.description || ""}
          </p>

          <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-100 pt-4 text-xs font-medium text-[#3e4a3d]">
            {prepTime && (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 aria-hidden="true" size={15} />
                Prep {prepTime}
              </span>
            )}
            {cookTime && (
              <span className="inline-flex items-center gap-1.5">
                <ChefHat aria-hidden="true" size={15} />
                Cook {cookTime}
              </span>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 text-sm font-semibold text-chaybook-primary">
            <span>View Recipe</span>
            <ArrowRight
              aria-hidden="true"
              size={18}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </div>
        </div>
      </Link>
    </article>
  );
}

function RecipeLoadingState() {
  return (
    <section
      aria-label="Loading recipes"
      aria-live="polite"
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm"
        >
          <div className="aspect-16/10 animate-pulse bg-gray-200" />
          <div className="space-y-4 p-6">
            <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-full animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </section>
  );
}

function RecipeStatus({ onRetry }) {
  return (
    <section
      role="alert"
      className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-red-100 bg-white px-6 py-12 text-center shadow-sm"
    >
      <CircleAlert aria-hidden="true" size={40} className="mb-4 text-red-600" />
      <h2 className="mb-2 text-xl font-semibold text-[#181c1b]">
        Unable to load recipes.
      </h2>
      <p className="mb-5 text-sm text-[#3e4a3d]">Please try again.</p>
      <Button type="button" onClick={onRetry}>
        <span className="inline-flex items-center gap-2">
          <RefreshCcw aria-hidden="true" size={16} />
          Try Again
        </span>
      </Button>
    </section>
  );
}

function RecipesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${keyword}:${retryCount}`;
  const [result, setResult] = useState({
    requestKey: null,
    status: "loading",
    recipes: [],
  });

  useEffect(() => {
    const controller = new AbortController();

    getRecipes(DEFAULT_RECIPE_CATEGORY_ID, keyword, {
      signal: controller.signal,
    })
      .then((data) => {
        setResult({ requestKey, status: "success", recipes: data });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setResult({ requestKey, status: "error", recipes: [] });
        }
      });

    return () => controller.abort();
  }, [keyword, requestKey]);

  const isCurrentResult = result.requestKey === requestKey;
  const isLoading = !isCurrentResult;
  const hasError = isCurrentResult && result.status === "error";
  const recipes = isCurrentResult ? result.recipes : [];

  const handleSearch = (event) => {
    event.preventDefault();
    setKeyword(searchInput.trim());
  };

  const handleRetry = () => {
    setRetryCount((count) => count + 1);
  };

  return (
    <main className="min-h-screen w-full bg-chaybook-container font-sans text-[#181c1b] antialiased">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-12 lg:pb-20">
        <header className="mb-10 flex flex-col items-center text-center sm:mb-12">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#92f5a4] px-3 py-1.5 text-xs font-semibold tracking-wide text-[#007233]">
            <ChefHat aria-hidden="true" size={16} />
            ChayBook Recipes
          </span>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-chaybook-primary sm:text-4xl lg:text-5xl">
            Recipes
          </h1>
          <p className="mb-7 max-w-2xl text-base leading-7 text-[#3e4a3d] sm:text-lg">
            Discover healthy, delicious vegetarian recipes made for everyday
            life.
          </p>

          <form
            onSubmit={handleSearch}
            role="search"
            className="flex w-full max-w-2xl items-center gap-2 rounded-xl border border-gray-100 bg-white p-1.5 shadow-sm focus-within:shadow-md"
          >
            <label className="sr-only" htmlFor="recipe-search">
              Search recipes
            </label>
            <Search
              aria-hidden="true"
              size={19}
              className="ml-3 shrink-0 text-gray-400"
            />
            <input
              id="recipe-search"
              type="search"
              placeholder="Search recipes..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:ring-0"
            />
            <Button type="submit" className="shrink-0 px-5">
              Search
            </Button>
          </form>
        </header>

        {isLoading ? (
          <RecipeLoadingState />
        ) : hasError ? (
          <RecipeStatus onRetry={handleRetry} />
        ) : recipes.length === 0 ? (
          <section className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-gray-200/80 bg-white px-6 py-12 text-center shadow-sm">
            <Search
              aria-hidden="true"
              size={40}
              strokeWidth={1.5}
              className="mb-4 text-[#6e7b6c]"
            />
            <h2 className="mb-2 text-xl font-semibold text-[#181c1b]">
              No recipes found.
            </h2>
            <p className="text-sm leading-6 text-[#3e4a3d]">
              Try another keyword or category.
            </p>
          </section>
        ) : (
          <section
            aria-label="Recipes"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.recipeId} recipe={recipe} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

export default RecipesPage;
