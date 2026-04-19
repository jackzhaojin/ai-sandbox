'use client';

import { useParams } from 'next/navigation';
import { useRecipeStore } from '@/app/lib/RecipeStore';
import { useSettings } from '@/app/lib/SettingsStore';
import { convertIngredient } from '@/app/lib/convertUnits';
import Link from 'next/link';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getRecipeById, toggleFavorite, getFavorites } = useRecipeStore();
  const { settings } = useSettings();

  const recipe = getRecipeById(id);
  const favorites = getFavorites();
  const isFavorite = favorites.some(r => r.id === id);

  if (!recipe) {
    return (
      <main className="mx-auto max-w-4xl p-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-white">Recipe not found</p>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The recipe you are looking for does not exist.
          </p>
          <Link
            href="/recipes"
            className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to Recipes
          </Link>
        </div>
      </main>
    );
  }

  const convertedIngredients = recipe.ingredients.map(ingredient =>
    convertIngredient(ingredient, settings.units)
  );

  const instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : [recipe.instructions];

  return (
    <main className="mx-auto max-w-4xl p-4">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/recipes" className="hover:text-blue-600 dark:hover:text-blue-400">
          Recipes
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">{recipe.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{recipe.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {recipe.category}
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Prep {recipe.prepTime}m
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.048 8.287 8.287 0 0 0 9 9.6a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
              </svg>
              Cook {recipe.cookTime}m
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Total {recipe.prepTime + recipe.cookTime}m
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/recipes/${id}/edit`}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            data-testid="edit-recipe-button"
          >
            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit
          </Link>
          {/* Favorite button */}
          <button
            onClick={() => toggleFavorite(id)}
            className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            data-testid="favorite-button"
          >
          {isFavorite ? (
            <svg className="h-7 w-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          ) : (
            <svg className="h-7 w-7 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          )}
        </button>
        </div>
      </div>

      {/* Image */}
      <div className="mt-6 overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="h-64 w-full object-cover md:h-80"
        />
      </div>

      {/* Content grid */}
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {/* Ingredients */}
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ingredients</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Units: {settings.units === 'metric' ? 'Metric (g, ml)' : 'Imperial (oz, cups)'}
          </p>
          <ul className="mt-4 space-y-2">
            {convertedIngredients.map((ingredient, index) => (
              <li
                key={index}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <span className="font-medium text-gray-900 dark:text-white">{ingredient.name}</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {ingredient.quantity} {ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Instructions</h2>
          <ol className="mt-4 space-y-4">
            {instructions.map((step, index) => (
              <li key={index} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {index + 1}
                </span>
                <p className="text-gray-700 dark:text-gray-300">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  );
}
