"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ingredients, type NewIngredient, type Ingredient } from "@/lib/db/schema";
import { eq, ilike, or } from "drizzle-orm";

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
 * Get all ingredients with optional search and category filter
 */
export async function getIngredients(params?: {
  search?: string;
  category?: string;
  limit?: number;
}): Promise<Result<Ingredient[]>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    let query = db.select().from(ingredients);

    // Apply search filter
    if (params?.search) {
      query = query.where(
        ilike(ingredients.name, `%${params.search}%`)
      ) as any;
    }

    // Apply category filter
    if (params?.category) {
      query = query.where(eq(ingredients.category, params.category as any)) as any;
    }

    // Apply limit
    if (params?.limit) {
      query = query.limit(params.limit) as any;
    }

    const ingredientsData = await query;

    return { success: true, data: ingredientsData };
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return {
      success: false,
      error: "Failed to fetch ingredients. Please try again.",
    };
  }
}

/**
 * Get a single ingredient by ID
 */
export async function getIngredientById(
  ingredientId: string
): Promise<Result<Ingredient>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const [ingredient] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.id, ingredientId))
      .limit(1);

    if (!ingredient) {
      return { success: false, error: "Ingredient not found" };
    }

    return { success: true, data: ingredient };
  } catch (error) {
    console.error("Error fetching ingredient:", error);
    return {
      success: false,
      error: "Failed to fetch ingredient. Please try again.",
    };
  }
}

/**
 * Create a new ingredient
 */
export async function createIngredient(input: {
  name: string;
  category: string;
}): Promise<Result<{ ingredientId: string }>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Ingredient name is required" };
    }

    if (!input.category) {
      return { success: false, error: "Ingredient category is required" };
    }

    // Check if ingredient already exists
    const [existingIngredient] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.name, input.name.trim()))
      .limit(1);

    if (existingIngredient) {
      return {
        success: false,
        error: "An ingredient with this name already exists",
      };
    }

    // Create ingredient
    const newIngredient: NewIngredient = {
      name: input.name.trim(),
      category: input.category as any,
    };

    const [ingredient] = await db
      .insert(ingredients)
      .values(newIngredient)
      .returning();

    return { success: true, data: { ingredientId: ingredient.id } };
  } catch (error) {
    console.error("Error creating ingredient:", error);
    return {
      success: false,
      error: "Failed to create ingredient. Please try again.",
    };
  }
}

/**
 * Search ingredients by name (for autocomplete)
 */
export async function searchIngredients(
  searchTerm: string
): Promise<Result<Ingredient[]>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    if (!searchTerm || searchTerm.trim().length === 0) {
      return { success: true, data: [] };
    }

    const ingredientsData = await db
      .select()
      .from(ingredients)
      .where(ilike(ingredients.name, `%${searchTerm.trim()}%`))
      .limit(20);

    return { success: true, data: ingredientsData };
  } catch (error) {
    console.error("Error searching ingredients:", error);
    return {
      success: false,
      error: "Failed to search ingredients. Please try again.",
    };
  }
}
