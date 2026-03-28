import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function RecipesPage() {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check environment variables.');
    }

    // Fetch all recipes with user information using Supabase client
    // Note: using explicit relationship name to avoid ambiguity
    const { data: recipeData, error } = await supabase
      .from('recipes')
      .select(`
        id,
        title,
        description,
        prep_time,
        cook_time,
        servings,
        difficulty,
        cuisine_type,
        image_url,
        users!recipes_user_id_users_id_fk (
          name,
          email
        )
      `)
      .limit(50);

    if (error) throw error;

    // Transform the data to match the expected format
    const allRecipes = recipeData?.map((recipe: any) => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      prepTime: recipe.prep_time,
      cookTime: recipe.cook_time,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      cuisineType: recipe.cuisine_type,
      imageUrl: recipe.image_url,
      userName: recipe.users?.name,
      userEmail: recipe.users?.email,
    })) || [];

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Recipe Discovery Platform
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Connected to Supabase ✅
          </p>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Database Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-sm text-green-600 font-medium">
                  Database Connection
                </p>
                <p className="text-2xl font-bold text-green-700">Active</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-600 font-medium">
                  Recipes Found
                </p>
                <p className="text-2xl font-bold text-blue-700">
                  {allRecipes.length}
                </p>
              </div>
            </div>
          </div>

          {allRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {recipe.imageUrl && (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {recipe.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {recipe.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {recipe.cuisineType && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                          {recipe.cuisineType}
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          recipe.difficulty === 'easy'
                            ? 'bg-green-100 text-green-700'
                            : recipe.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {recipe.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>⏱️ {recipe.prepTime + recipe.cookTime} min</span>
                      <span>🍽️ {recipe.servings} servings</span>
                    </div>
                    {recipe.userName && (
                      <p className="text-xs text-gray-400 mt-3">
                        by {recipe.userName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">
                No recipes found. Run the seed script to add sample data.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null
        ? JSON.stringify(error, null, 2)
        : String(error);

    console.error('Recipe page error:', error);

    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            ❌ Database Connection Error
          </h1>
          <p className="text-gray-700 mb-4">
            Failed to connect to Supabase database.
          </p>
          <div className="bg-gray-100 rounded p-4 mb-4 overflow-auto max-h-96">
            <code className="text-sm text-gray-800 whitespace-pre-wrap break-all">
              {errorMessage}
            </code>
          </div>
          <p className="text-sm text-gray-600">
            Make sure your SUPABASE_URL and SUPABASE_ANON_KEY are correctly configured in .env.local
          </p>
        </div>
      </div>
    );
  }
}
