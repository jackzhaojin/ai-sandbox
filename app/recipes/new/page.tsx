import Link from 'next/link';
import RecipeForm from '@/app/components/RecipeForm';

export default function NewRecipePage() {
  return (
    <main className="mx-auto max-w-3xl p-4">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/recipes" className="hover:text-blue-600 dark:hover:text-blue-400">
          Recipes
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">New Recipe</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Recipe</h1>

      <RecipeForm mode="create" />
    </main>
  );
}
