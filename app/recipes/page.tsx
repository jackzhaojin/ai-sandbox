import { Suspense } from 'react';
import Link from 'next/link';
import RecipeGrid from './RecipeGrid';

export default function RecipesPage() {
  return (
    <main className="mx-auto max-w-6xl p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recipes</h1>
        <Link
          href="/recipes/new"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Recipe
        </Link>
      </div>
      <div className="mt-6">
        <Suspense fallback={<div className="text-gray-600 dark:text-gray-400">Loading recipes…</div>}>
          <RecipeGrid />
        </Suspense>
      </div>
    </main>
  );
}
