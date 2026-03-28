import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  recipes,
  users,
  recipeIngredients,
  ingredients,
  instructions,
  dietaryTags,
  recipeDietaryTags,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, Users, ChefHat, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";

interface RecipeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  // Fetch recipe with author
  const [recipe] = await db
    .select({
      id: recipes.id,
      userId: recipes.userId,
      title: recipes.title,
      description: recipes.description,
      prepTime: recipes.prepTime,
      cookTime: recipes.cookTime,
      servings: recipes.servings,
      difficulty: recipes.difficulty,
      cuisineType: recipes.cuisineType,
      imageUrl: recipes.imageUrl,
      createdAt: recipes.createdAt,
      authorName: users.name,
    })
    .from(recipes)
    .leftJoin(users, eq(recipes.userId, users.id))
    .where(eq(recipes.id, id))
    .limit(1);

  if (!recipe) {
    notFound();
  }

  // Fetch ingredients
  const recipeIngredientsData = await db
    .select({
      id: recipeIngredients.id,
      quantity: recipeIngredients.quantity,
      unit: recipeIngredients.unit,
      notes: recipeIngredients.notes,
      ingredientName: ingredients.name,
    })
    .from(recipeIngredients)
    .leftJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
    .where(eq(recipeIngredients.recipeId, id));

  // Fetch instructions
  const recipeInstructions = await db
    .select()
    .from(instructions)
    .where(eq(instructions.recipeId, id))
    .orderBy(instructions.stepNumber);

  // Fetch dietary tags
  const recipeTags = await db
    .select({
      tagName: dietaryTags.name,
    })
    .from(recipeDietaryTags)
    .leftJoin(dietaryTags, eq(recipeDietaryTags.dietaryTagId, dietaryTags.id))
    .where(eq(recipeDietaryTags.recipeId, id));

  const totalTime = recipe.prepTime + recipe.cookTime;
  const difficultyColor = {
    easy: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    hard: "bg-red-100 text-red-800 border-red-200",
  }[recipe.difficulty];

  const isOwner = session.user.id === recipe.userId;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        href="/recipes"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to recipes
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {recipe.title}
            </h1>
            <p className="text-gray-600 mb-4">{recipe.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>By {recipe.authorName}</span>
              <span>•</span>
              <span>{new Date(recipe.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <FavoriteButton recipeId={id} />
        </div>

        {/* Tags and Difficulty */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={difficultyColor} variant="outline">
            {recipe.difficulty}
          </Badge>
          {recipe.cuisineType && (
            <Badge variant="secondary">{recipe.cuisineType}</Badge>
          )}
          {recipeTags.map(
            (tag) =>
              tag.tagName && (
                <Badge key={tag.tagName} variant="outline">
                  {tag.tagName}
                </Badge>
              )
          )}
        </div>
      </div>

      {/* Image */}
      {recipe.imageUrl && (
        <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Recipe Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Total Time</p>
              <p className="text-xl font-semibold">{totalTime} min</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Servings</p>
              <p className="text-xl font-semibold">{recipe.servings}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Difficulty</p>
              <p className="text-xl font-semibold capitalize">
                {recipe.difficulty}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ingredients */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ingredients
            </h2>
            <ul className="space-y-3">
              {recipeIngredientsData.map((ingredient) => (
                <li
                  key={ingredient.id}
                  className="flex items-start gap-2 text-gray-700"
                >
                  <span className="text-orange-600 mt-1">•</span>
                  <span>
                    {ingredient.quantity} {ingredient.unit}{" "}
                    {ingredient.ingredientName}
                    {ingredient.notes && (
                      <span className="text-sm text-gray-500">
                        {" "}
                        ({ingredient.notes})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Instructions */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Instructions
            </h2>
            <ol className="space-y-6">
              {recipeInstructions.map((instruction) => (
                <li
                  key={instruction.id}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {instruction.stepNumber}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700">{instruction.description}</p>
                    {instruction.duration && (
                      <p className="text-sm text-gray-500 mt-1">
                        Time: {instruction.duration} minutes
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      {/* Edit Button (if owner) */}
      {isOwner && (
        <div className="mt-8 flex justify-end">
          <Link
            href={`/recipes/${id}/edit`}
            className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Edit Recipe
          </Link>
        </div>
      )}
    </div>
  );
}
