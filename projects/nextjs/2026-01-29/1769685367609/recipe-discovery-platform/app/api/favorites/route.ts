import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { favorites, recipes, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/validation";

/**
 * GET /api/favorites - Get current user's favorite recipes
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return createErrorResponse("Unauthorized", 401);
    }

    // Get favorites with recipe and user data
    const favoritesData = await db
      .select({
        favorite: favorites,
        recipe: recipes,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(favorites)
      .leftJoin(recipes, eq(favorites.recipeId, recipes.id))
      .leftJoin(users, eq(recipes.userId, users.id))
      .where(eq(favorites.userId, session.user.id))
      .orderBy(desc(favorites.createdAt));

    // Format response
    const formattedFavorites = favoritesData.map((f) => ({
      ...f.recipe,
      user: f.user,
      favoritedAt: f.favorite.createdAt,
    }));

    return createSuccessResponse({
      favorites: formattedFavorites,
      count: formattedFavorites.length,
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return createErrorResponse("Failed to fetch favorites", 500);
  }
}
