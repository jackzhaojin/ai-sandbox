"use client";

import { useState, useEffect } from "react";
import { RecipeCard } from "@/components/recipe-card";
import { Heart } from "lucide-react";

interface FavoriteRecipe {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  cuisineType: string | null;
  imageUrl: string | null;
  authorName: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      try {
        const response = await fetch("/api/favorites");
        if (response.ok) {
          const data = await response.json();
          setFavorites(data.favorites || []);
        }
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-8 h-8 text-red-500 fill-current" />
          <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
        </div>
        <p className="text-gray-600">
          Your collection of favorite recipes
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading your favorites...</p>
        </div>
      ) : favorites.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-gray-600">
            {favorites.length} favorite{favorites.length !== 1 ? "s" : ""}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                description={recipe.description}
                prepTime={recipe.prepTime}
                cookTime={recipe.cookTime}
                servings={recipe.servings}
                difficulty={recipe.difficulty}
                cuisineType={recipe.cuisineType}
                imageUrl={recipe.imageUrl}
                authorName={recipe.authorName}
                dietaryTags={[]}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            You haven't favorited any recipes yet.
          </p>
          <p className="text-sm text-gray-500">
            Browse recipes and click the heart icon to save your favorites!
          </p>
        </div>
      )}
    </div>
  );
}
