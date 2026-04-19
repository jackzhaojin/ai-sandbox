'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRecipeStore } from '@/app/lib/RecipeStore';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const { getRecipes } = useRecipeStore();
  const recipes = getRecipes();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredRecipes = useMemo(() => {
    const term = debouncedTerm.trim().toLowerCase();
    if (!term) return recipes;
    return recipes.filter(recipe => {
      const titleMatch = recipe.title.toLowerCase().includes(term);
      const ingredientMatch = recipe.ingredients.some(ing =>
        ing.name.toLowerCase().includes(term)
      );
      return titleMatch || ingredientMatch;
    });
  }, [recipes, debouncedTerm]);

  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-400">
        Find recipes by title or ingredient
      </p>

      <div className="mt-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search recipes or ingredients…"
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            data-testid="search-input"
          />
        </div>
      </div>

      <div className="mt-6">
        {filteredRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              No recipes found
            </p>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {debouncedTerm.trim()
                ? `No recipes match "${debouncedTerm.trim()}".`
                : 'Start typing to search for recipes.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecipes.map(recipe => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="relative aspect-video overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {recipe.title}
                    </h2>
                    <span className="inline-flex shrink-0 items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {recipe.category}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
