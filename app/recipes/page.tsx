import { Suspense } from 'react';
import RecipeGrid from './RecipeGrid';

export default function RecipesPage() {
  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recipes</h1>
      <div className="mt-6">
        <Suspense fallback={<div className="text-gray-600 dark:text-gray-400">Loading recipes…</div>}>
          <RecipeGrid />
        </Suspense>
      </div>
    </main>
  );
}
