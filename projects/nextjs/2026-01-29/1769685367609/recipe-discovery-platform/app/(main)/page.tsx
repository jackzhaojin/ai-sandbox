import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { recipes, users, dietaryTags, recipeDietaryTags } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import { RecipeCard } from "@/components/recipe-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch recent recipes with author info and dietary tags
  const recentRecipes = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      description: recipes.description,
      prepTime: recipes.prepTime,
      cookTime: recipes.cookTime,
      servings: recipes.servings,
      difficulty: recipes.difficulty,
      cuisineType: recipes.cuisineType,
      imageUrl: recipes.imageUrl,
      authorName: users.name,
    })
    .from(recipes)
    .leftJoin(users, sql`${recipes.userId} = ${users.id}`)
    .orderBy(desc(recipes.createdAt))
    .limit(6);

  // Fetch dietary tags for each recipe
  const recipeIds = recentRecipes.map((r) => r.id);
  const tagsData = await db
    .select({
      recipeId: recipeDietaryTags.recipeId,
      tagName: dietaryTags.name,
    })
    .from(recipeDietaryTags)
    .leftJoin(dietaryTags, sql`${recipeDietaryTags.dietaryTagId} = ${dietaryTags.id}`)
    .where(sql`${recipeDietaryTags.recipeId} IN ${recipeIds}`);

  // Group tags by recipe
  const recipeTagsMap = tagsData.reduce((acc, item) => {
    if (!acc[item.recipeId]) {
      acc[item.recipeId] = [];
    }
    if (item.tagName) {
      acc[item.recipeId].push(item.tagName);
    }
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome back, {session.user.name}!
        </h1>
        <p className="text-lg text-gray-600">
          Discover delicious recipes, save your favorites, and share your own
          culinary creations.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Total Recipes
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {recentRecipes.length > 0 ? "100+" : "0"}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Your Favorites
          </h3>
          <p className="text-3xl font-bold text-orange-600">0</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Recipes Created
          </h3>
          <p className="text-3xl font-bold text-green-600">0</p>
        </div>
      </div>

      {/* Recent Recipes Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Recipes</h2>
          <Link
            href="/recipes"
            className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                description={recipe.description}
                prepTime={recipe.prepTime}
                cookTime={recipe.cookTime}
                servings={recipe.servings}
                difficulty={recipe.difficulty as "easy" | "medium" | "hard"}
                cuisineType={recipe.cuisineType}
                imageUrl={recipe.imageUrl}
                authorName={recipe.authorName || undefined}
                dietaryTags={recipeTagsMap[recipe.id] || []}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">
              No recipes yet. Be the first to create one!
            </p>
            <Link
              href="/recipes/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium"
            >
              Create Your First Recipe
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/search"
          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Search Recipes
          </h3>
          <p className="text-gray-600 text-sm">
            Find recipes by ingredients, cuisine, or dietary preferences
          </p>
        </Link>

        <Link
          href="/recipes/new"
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Share Your Recipe
          </h3>
          <p className="text-gray-600 text-sm">
            Create and share your favorite recipes with the community
          </p>
        </Link>
      </div>
    </div>
  );
}
