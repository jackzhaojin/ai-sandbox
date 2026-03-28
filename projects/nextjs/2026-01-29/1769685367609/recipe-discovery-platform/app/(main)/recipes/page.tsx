"use client";

import { useState, useEffect } from "react";
import { RecipeCard } from "@/components/recipe-card";
import { SearchFilters, FilterOptions } from "@/components/search-filters";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  cuisineType: string | null;
  imageUrl: string | null;
  dietaryTags: string[];
  authorName?: string;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [loading, setLoading] = useState(true);

  // Fetch recipes on mount
  useEffect(() => {
    async function fetchRecipes() {
      try {
        const response = await fetch("/api/recipes");
        if (response.ok) {
          const data = await response.json();
          // API returns {success: true, data: {recipes: [...]}}
          const recipesList = data.data?.recipes || data.recipes || [];
          setRecipes(recipesList);
          setFilteredRecipes(recipesList);
        }
      } catch (error) {
        console.error("Failed to fetch recipes:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecipes();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...recipes];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(query) ||
          recipe.description.toLowerCase().includes(query) ||
          recipe.cuisineType?.toLowerCase().includes(query)
      );
    }

    // Difficulty filter
    if (filters.difficulty) {
      filtered = filtered.filter(
        (recipe) => recipe.difficulty === filters.difficulty
      );
    }

    // Cuisine filter
    if (filters.cuisineType) {
      filtered = filtered.filter(
        (recipe) => recipe.cuisineType === filters.cuisineType
      );
    }

    // Max time filter
    if (filters.maxTime) {
      filtered = filtered.filter(
        (recipe) => recipe.prepTime + recipe.cookTime <= filters.maxTime!
      );
    }

    // Dietary tags filter
    if (filters.dietaryTags && filters.dietaryTags.length > 0) {
      filtered = filtered.filter((recipe) =>
        filters.dietaryTags!.some((tag) => recipe.dietaryTags.includes(tag))
      );
    }

    setFilteredRecipes(filtered);
  }, [searchQuery, filters, recipes]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">All Recipes</h1>
        <p className="text-gray-600">
          Browse our collection of delicious recipes
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search recipes by name, cuisine, or ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <SearchFilters onFilterChange={setFilters} />
        </div>

        {/* Recipes Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading recipes...</p>
            </div>
          ) : filteredRecipes.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredRecipes.length} of {recipes.length} recipes
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
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
                    dietaryTags={recipe.dietaryTags}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600">
                {recipes.length === 0
                  ? "No recipes found. Be the first to create one!"
                  : "No recipes match your filters. Try adjusting your search."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
