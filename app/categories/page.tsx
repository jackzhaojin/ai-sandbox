'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRecipeStore } from '@/app/lib/RecipeStore';

const CATEGORIES = [
  { name: 'Main', imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80' },
  { name: 'Dessert', imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80' },
  { name: 'Salad', imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80' },
  { name: 'Appetizer', imageUrl: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=800&q=80' },
  { name: 'Drink', imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80' },
];

export default function CategoriesPage() {
  const { getRecipes } = useRecipeStore();
  const recipes = getRecipes();

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const recipe of recipes) {
      map[recipe.category] = (map[recipe.category] || 0) + 1;
    }
    return map;
  }, [recipes]);

  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-400">Browse recipes by category</p>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map(category => {
          const count = counts[category.name] || 0;
          return (
            <Link
              key={category.name}
              href={`/recipes?category=${encodeURIComponent(category.name)}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              data-testid={`category-card-${category.name.toLowerCase()}`}
            >
              <div className="relative aspect-video overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h2 className="text-xl font-bold text-white">{category.name}</h2>
                  <p className="text-sm text-white/90">
                    {count} {count === 1 ? 'recipe' : 'recipes'}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
