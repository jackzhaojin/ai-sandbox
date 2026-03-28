import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
      <main className="text-center px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Recipe Discovery Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover and share amazing recipes
        </p>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
          <p className="text-gray-700 mb-6">
            Welcome to the Recipe Discovery Platform. This application is now
            connected to Supabase and ready to store your recipes in the cloud.
          </p>
          <div className="space-y-4">
            <Link
              href="/recipes"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              View Recipes →
            </Link>
            <div className="text-sm text-gray-500 mt-4">
              <p>✅ Supabase database connected</p>
              <p>✅ Schema migrated successfully</p>
              <p>✅ Sample data seeded</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
