'use client';

import { useParams } from 'next/navigation';
import { useRecipeStore } from '@/app/lib/RecipeStore';
import RecipeForm from '@/app/components/RecipeForm';
import Link from 'next/link';

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const { getRecipeById } = useRecipeStore();

  const recipe = getRecipeById(id);

  if (!recipe) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-white">Recipe not found</p>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The recipe you are trying to edit does not exist.
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

  return (
    <main className="mx-auto max-w-3xl p-4">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/recipes" className="hover:text-blue-600 dark:hover:text-blue-400">
          Recipes
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/recipes/${recipe.id}`}
          className="hover:text-blue-600 dark:hover:text-blue-400"
        >
          {recipe.title}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">Edit</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Recipe</h1>

      <RecipeForm mode="edit" initialRecipe={recipe} />
    </main>
  );
}
