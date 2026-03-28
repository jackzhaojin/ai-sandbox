"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  favorites,
  recipes,
  users,
  type Favorite,
  type NewFavorite,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Result types
interface SuccessResult<T> {
  success: true;
  data: T;
}

interface ErrorResult {
  success: false;
  error: string;
}

type Result<T> = SuccessResult<T> | ErrorResult;

/**
 * Add a recipe to user's favorites
 */
export async function addToFavorites(
  recipeId: string
): Promise<Result<{ recipeId: string }>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check if recipe exists
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!recipe) {
      return { success: false, error: "Recipe not found" };
    }

    // Check if already favorited
    const [existingFavorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, session.user.id),
          eq(favorites.recipeId, recipeId)
        )
      )
      .limit(1);

    if (existingFavorite) {
      return {
        success: false,
        error: "Recipe is already in your favorites",
      };
    }

    // Add to favorites
    const newFavorite: NewFavorite = {
      userId: session.user.id,
      recipeId: recipeId,
    };

    await db.insert(favorites).values(newFavorite);

    revalidatePath("/favorites");
    revalidatePath(`/recipes/${recipeId}`);

    return { success: true, data: { recipeId } };
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return {
      success: false,
      error: "Failed to add to favorites. Please try again.",
    };
  }
}

/**
 * Remove a recipe from user's favorites
 */
export async function removeFromFavorites(
  recipeId: string
): Promise<Result<{ recipeId: string }>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check if favorited
    const [existingFavorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, session.user.id),
          eq(favorites.recipeId, recipeId)
        )
      )
      .limit(1);

    if (!existingFavorite) {
      return {
        success: false,
        error: "Recipe is not in your favorites",
      };
    }

    // Remove from favorites
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, session.user.id),
          eq(favorites.recipeId, recipeId)
        )
      );

    revalidatePath("/favorites");
    revalidatePath(`/recipes/${recipeId}`);

    return { success: true, data: { recipeId } };
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return {
      success: false,
      error: "Failed to remove from favorites. Please try again.",
    };
  }
}

/**
 * Get user's favorite recipes
 */
export async function getFavoriteRecipes(): Promise<Result<any[]>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
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

    return { success: true, data: formattedFavorites };
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return {
      success: false,
      error: "Failed to fetch favorites. Please try again.",
    };
  }
}

/**
 * Check if a recipe is favorited by the current user
 */
export async function isFavorited(
  recipeId: string
): Promise<Result<{ isFavorited: boolean }>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const [favorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, session.user.id),
          eq(favorites.recipeId, recipeId)
        )
      )
      .limit(1);

    return { success: true, data: { isFavorited: !!favorite } };
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return {
      success: false,
      error: "Failed to check favorite status. Please try again.",
    };
  }
}

/**
 * Toggle favorite status for a recipe
 */
export async function toggleFavorite(
  recipeId: string
): Promise<Result<{ isFavorited: boolean }>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check if already favorited
    const [existingFavorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, session.user.id),
          eq(favorites.recipeId, recipeId)
        )
      )
      .limit(1);

    if (existingFavorite) {
      // Remove from favorites
      await db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, session.user.id),
            eq(favorites.recipeId, recipeId)
          )
        );

      revalidatePath("/favorites");
      revalidatePath(`/recipes/${recipeId}`);

      return { success: true, data: { isFavorited: false } };
    } else {
      // Check if recipe exists
      const [recipe] = await db
        .select()
        .from(recipes)
        .where(eq(recipes.id, recipeId))
        .limit(1);

      if (!recipe) {
        return { success: false, error: "Recipe not found" };
      }

      // Add to favorites
      const newFavorite: NewFavorite = {
        userId: session.user.id,
        recipeId: recipeId,
      };

      await db.insert(favorites).values(newFavorite);

      revalidatePath("/favorites");
      revalidatePath(`/recipes/${recipeId}`);

      return { success: true, data: { isFavorited: true } };
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return {
      success: false,
      error: "Failed to toggle favorite. Please try again.",
    };
  }
}
