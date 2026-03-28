import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { recipes, favorites } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { RecipeCard } from "@/components/recipe-card";
import { User, Book, Heart, Calendar } from "lucide-react";
import { signOutAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get user's recipes
  const userRecipes = await db
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
      createdAt: recipes.createdAt,
    })
    .from(recipes)
    .where(eq(recipes.userId, session.user.id))
    .orderBy(recipes.createdAt)
    .limit(6);

  // Get counts
  const [recipesCount] = await db
    .select({ count: count() })
    .from(recipes)
    .where(eq(recipes.userId, session.user.id));

  const [favoritesCount] = await db
    .select({ count: count() })
    .from(favorites)
    .where(eq(favorites.userId, session.user.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {session.user.name}
              </h1>
              <p className="text-gray-600">{session.user.email}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Member since {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <form action={signOutAction}>
            <Button variant="outline" type="submit">
              Sign Out
            </Button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Book className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Recipes Created</p>
              <p className="text-2xl font-bold text-gray-900">
                {recipesCount.count}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Favorites</p>
              <p className="text-2xl font-bold text-gray-900">
                {favoritesCount.count}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Days Active</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
          </div>
        </Card>
      </div>

      {/* User's Recipes */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Recipes</h2>
          {userRecipes.length > 0 && (
            <span className="text-sm text-gray-600">
              Showing {Math.min(6, userRecipes.length)} of{" "}
              {recipesCount.count}
            </span>
          )}
        </div>

        {userRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRecipes.map((recipe) => (
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
                authorName={session.user.name || "You"}
                dietaryTags={[]}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              You haven't created any recipes yet.
            </p>
            <Button asChild>
              <a href="/recipes/new">Create Your First Recipe</a>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
