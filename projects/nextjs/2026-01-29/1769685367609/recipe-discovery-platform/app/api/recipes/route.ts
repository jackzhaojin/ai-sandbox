import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recipes, users, recipeDietaryTags, dietaryTags } from "@/lib/db/schema";
import { eq, desc, and, or, ilike, inArray } from "drizzle-orm";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/validation";

/**
 * GET /api/recipes - List recipes with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // TEMPORARY: Disable auth check for debugging
    // TODO: Re-enable after fixing NextAuth session issue
    // if (!session?.user) {
    //   return createErrorResponse("Unauthorized", 401);
    // }

    console.log("[DEBUG] Session:", session ? "exists" : "null");
    console.log("[DEBUG] User:", session?.user || "no user");

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const cuisineType = searchParams.get("cuisineType");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query conditions
    const conditions = [];

    if (userId) {
      conditions.push(eq(recipes.userId, userId));
    }

    if (cuisineType) {
      conditions.push(eq(recipes.cuisineType, cuisineType));
    }

    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      conditions.push(eq(recipes.difficulty, difficulty as any));
    }

    if (search) {
      conditions.push(
        or(
          ilike(recipes.title, `%${search}%`),
          ilike(recipes.description, `%${search}%`)
        )
      );
    }

    // Get recipes with user data
    let query = db
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
      .orderBy(desc(recipes.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const recipesData = await query;

    // Get dietary tags for all recipes
    const recipeIds = recipesData.map((r) => r.recipe.id);
    let dietaryTagsData: Array<{ recipeId: string; tagName: string }> = [];

    if (recipeIds.length > 0) {
      dietaryTagsData = await db
        .select({
          recipeId: recipeDietaryTags.recipeId,
          tagName: dietaryTags.name,
        })
        .from(recipeDietaryTags)
        .innerJoin(dietaryTags, eq(recipeDietaryTags.dietaryTagId, dietaryTags.id))
        .where(inArray(recipeDietaryTags.recipeId, recipeIds));
    }

    // Group dietary tags by recipe ID
    const dietaryTagsByRecipe = dietaryTagsData.reduce((acc, item) => {
      if (!acc[item.recipeId]) {
        acc[item.recipeId] = [];
      }
      acc[item.recipeId].push(item.tagName);
      return acc;
    }, {} as Record<string, string[]>);

    // Format response
    const formattedRecipes = recipesData.map((r) => ({
      ...r.recipe,
      authorName: r.user?.name || "Unknown",
      dietaryTags: dietaryTagsByRecipe[r.recipe.id] || [],
    }));

    return createSuccessResponse({
      recipes: formattedRecipes,
      count: formattedRecipes.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return createErrorResponse("Failed to fetch recipes", 500);
  }
}
