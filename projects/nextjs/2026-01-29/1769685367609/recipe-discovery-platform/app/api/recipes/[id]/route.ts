import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  recipes,
  recipeIngredients,
  instructions,
  recipeDietaryTags,
  ingredients,
  dietaryTags,
  users,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createErrorResponse,
  createSuccessResponse,
  isValidUUID,
} from "@/lib/validation";

/**
 * GET /api/recipes/[id] - Get a specific recipe by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const { id: recipeId } = await params;

    if (!isValidUUID(recipeId)) {
      return createErrorResponse("Invalid recipe ID", 400);
    }

    // Get recipe with user
    const [recipe] = await db
      .select({
        recipe: recipes,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(recipes)
      .leftJoin(users, eq(recipes.userId, users.id))
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!recipe) {
      return createErrorResponse("Recipe not found", 404);
    }

    // Get ingredients
    const recipeIngredientsData = await db
      .select({
        id: recipeIngredients.id,
        quantity: recipeIngredients.quantity,
        unit: recipeIngredients.unit,
        notes: recipeIngredients.notes,
        ingredient: ingredients,
      })
      .from(recipeIngredients)
      .leftJoin(
        ingredients,
        eq(recipeIngredients.ingredientId, ingredients.id)
      )
      .where(eq(recipeIngredients.recipeId, recipeId));

    // Get instructions
    const instructionsData = await db
      .select()
      .from(instructions)
      .where(eq(instructions.recipeId, recipeId))
      .orderBy(instructions.stepNumber);

    // Get dietary tags
    const dietaryTagsData = await db
      .select({
        tag: dietaryTags,
      })
      .from(recipeDietaryTags)
      .leftJoin(
        dietaryTags,
        eq(recipeDietaryTags.dietaryTagId, dietaryTags.id)
      )
      .where(eq(recipeDietaryTags.recipeId, recipeId));

    const fullRecipe = {
      ...recipe.recipe,
      user: recipe.user,
      ingredients: recipeIngredientsData,
      instructions: instructionsData,
      dietaryTags: dietaryTagsData.map((dt) => dt.tag),
    };

    return createSuccessResponse(fullRecipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return createErrorResponse("Failed to fetch recipe", 500);
  }
}
