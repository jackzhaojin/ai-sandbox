import { Suspense } from 'react';
import FavoritesGrid from './FavoritesGrid';

export default function FavoritesPage() {
  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Favorites</h1>
      <div className="mt-6">
        <Suspense fallback={<div className="text-gray-600 dark:text-gray-400">Loading favorites…</div>}>
          <FavoritesGrid />
        </Suspense>
      </div>
    </main>
  );
}
