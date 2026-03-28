"use server";

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
  type NewRecipe,
  type NewRecipeIngredient,
  type NewInstruction,
} from "@/lib/db/schema";
import { eq, desc, and, or, ilike, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Types for recipe creation/update
export interface RecipeIngredientInput {
  ingredientId: string;
  quantity: string;
  unit: string;
  notes?: string;
}

export interface InstructionInput {
  stepNumber: number;
  description: string;
  duration?: number;
}

export interface RecipeInput {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  cuisineType?: string;
  imageUrl?: string;
  ingredients: RecipeIngredientInput[];
  instructions: InstructionInput[];
  dietaryTagIds: string[];
}

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
 * Create a new recipe with ingredients, instructions, and dietary tags
 */
export async function createRecipe(
  input: RecipeInput
): Promise<Result<{ recipeId: string }>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Validate input
    if (!input.title || input.title.trim().length === 0) {
      return { success: false, error: "Recipe title is required" };
    }
    if (!input.description || input.description.trim().length === 0) {
      return { success: false, error: "Recipe description is required" };
    }
    if (input.prepTime < 0 || input.cookTime < 0) {
      return { success: false, error: "Prep and cook times must be positive" };
    }
    if (input.servings < 1) {
      return { success: false, error: "Servings must be at least 1" };
    }
    if (input.ingredients.length === 0) {
      return { success: false, error: "At least one ingredient is required" };
    }
    if (input.instructions.length === 0) {
      return { success: false, error: "At least one instruction step is required" };
    }

    // Create recipe
    const newRecipe: NewRecipe = {
      userId: session.user.id,
      title: input.title.trim(),
      description: input.description.trim(),
      prepTime: input.prepTime,
      cookTime: input.cookTime,
      servings: input.servings,
      difficulty: input.difficulty,
      cuisineType: input.cuisineType?.trim() || null,
      imageUrl: input.imageUrl?.trim() || null,
    };

    const [recipe] = await db.insert(recipes).values(newRecipe).returning();

    // Create recipe ingredients
    if (input.ingredients.length > 0) {
      const recipeIngredientsData: NewRecipeIngredient[] = input.ingredients.map(
        (ingredient) => ({
          recipeId: recipe.id,
          ingredientId: ingredient.ingredientId,
          quantity: ingredient.quantity,
          unit: ingredient.unit as any,
          notes: ingredient.notes?.trim() || null,
        })
      );

      await db.insert(recipeIngredients).values(recipeIngredientsData);
    }

    // Create instructions
    if (input.instructions.length > 0) {
      const instructionsData: NewInstruction[] = input.instructions.map(
        (instruction) => ({
          recipeId: recipe.id,
          stepNumber: instruction.stepNumber,
          description: instruction.description.trim(),
          duration: instruction.duration || null,
        })
      );

      await db.insert(instructions).values(instructionsData);
    }

    // Create dietary tag associations
    if (input.dietaryTagIds.length > 0) {
      const dietaryTagsData = input.dietaryTagIds.map((tagId) => ({
        recipeId: recipe.id,
        dietaryTagId: tagId,
      }));

      await db.insert(recipeDietaryTags).values(dietaryTagsData);
    }

    revalidatePath("/recipes");

    return { success: true, data: { recipeId: recipe.id } };
  } catch (error) {
    console.error("Error creating recipe:", error);
    return {
      success: false,
      error: "Failed to create recipe. Please try again.",
    };
  }
}

/**
 * Get a recipe by ID with all related data
 */
export async function getRecipeById(
  recipeId: string
): Promise<Result<any>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
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
      return { success: false, error: "Recipe not found" };
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

    return { success: true, data: fullRecipe };
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return {
      success: false,
      error: "Failed to fetch recipe. Please try again.",
    };
  }
}

/**
 * Get all recipes with optional filtering
 */
export async function getRecipes(params?: {
  userId?: string;
  cuisineType?: string;
  difficulty?: "easy" | "medium" | "hard";
  dietaryTagIds?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Result<any[]>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Build query conditions
    const conditions = [];

    if (params?.userId) {
      conditions.push(eq(recipes.userId, params.userId));
    }

    if (params?.cuisineType) {
      conditions.push(eq(recipes.cuisineType, params.cuisineType));
    }

    if (params?.difficulty) {
      conditions.push(eq(recipes.difficulty, params.difficulty));
    }

    if (params?.search) {
      conditions.push(
        or(
          ilike(recipes.title, `%${params.search}%`),
          ilike(recipes.description, `%${params.search}%`)
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
      .orderBy(desc(recipes.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (params?.limit) {
      query = query.limit(params.limit) as any;
    }

    if (params?.offset) {
      query = query.offset(params.offset) as any;
    }

    const recipesData = await query;

    // Filter by dietary tags if specified
    let filteredRecipes = recipesData;
    if (params?.dietaryTagIds && params.dietaryTagIds.length > 0) {
      // Get recipe IDs that have all specified dietary tags
      const recipeIdsWithTags = await db
        .select({ recipeId: recipeDietaryTags.recipeId })
        .from(recipeDietaryTags)
        .where(inArray(recipeDietaryTags.dietaryTagId, params.dietaryTagIds))
        .groupBy(recipeDietaryTags.recipeId);

      const validRecipeIds = recipeIdsWithTags.map((r) => r.recipeId);
      filteredRecipes = recipesData.filter((r) =>
        validRecipeIds.includes(r.recipe.id)
      );
    }

    // Format response
    const formattedRecipes = filteredRecipes.map((r) => ({
      ...r.recipe,
      user: r.user,
    }));

    return { success: true, data: formattedRecipes };
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return {
      success: false,
      error: "Failed to fetch recipes. Please try again.",
    };
  }
}

/**
 * Update an existing recipe
 */
export async function updateRecipe(
  recipeId: string,
  input: RecipeInput
): Promise<Result<{ recipeId: string }>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check if recipe exists and user owns it
    const [existingRecipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!existingRecipe) {
      return { success: false, error: "Recipe not found" };
    }

    if (existingRecipe.userId !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to update this recipe",
      };
    }

    // Validate input
    if (!input.title || input.title.trim().length === 0) {
      return { success: false, error: "Recipe title is required" };
    }
    if (!input.description || input.description.trim().length === 0) {
      return { success: false, error: "Recipe description is required" };
    }
    if (input.prepTime < 0 || input.cookTime < 0) {
      return { success: false, error: "Prep and cook times must be positive" };
    }
    if (input.servings < 1) {
      return { success: false, error: "Servings must be at least 1" };
    }

    // Update recipe
    await db
      .update(recipes)
      .set({
        title: input.title.trim(),
        description: input.description.trim(),
        prepTime: input.prepTime,
        cookTime: input.cookTime,
        servings: input.servings,
        difficulty: input.difficulty,
        cuisineType: input.cuisineType?.trim() || null,
        imageUrl: input.imageUrl?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, recipeId));

    // Delete existing related data
    await db
      .delete(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipeId));
    await db
      .delete(instructions)
      .where(eq(instructions.recipeId, recipeId));
    await db
      .delete(recipeDietaryTags)
      .where(eq(recipeDietaryTags.recipeId, recipeId));

    // Re-create recipe ingredients
    if (input.ingredients.length > 0) {
      const recipeIngredientsData: NewRecipeIngredient[] = input.ingredients.map(
        (ingredient) => ({
          recipeId: recipeId,
          ingredientId: ingredient.ingredientId,
          quantity: ingredient.quantity,
          unit: ingredient.unit as any,
          notes: ingredient.notes?.trim() || null,
        })
      );

      await db.insert(recipeIngredients).values(recipeIngredientsData);
    }

    // Re-create instructions
    if (input.instructions.length > 0) {
      const instructionsData: NewInstruction[] = input.instructions.map(
        (instruction) => ({
          recipeId: recipeId,
          stepNumber: instruction.stepNumber,
          description: instruction.description.trim(),
          duration: instruction.duration || null,
        })
      );

      await db.insert(instructions).values(instructionsData);
    }

    // Re-create dietary tag associations
    if (input.dietaryTagIds.length > 0) {
      const dietaryTagsData = input.dietaryTagIds.map((tagId) => ({
        recipeId: recipeId,
        dietaryTagId: tagId,
      }));

      await db.insert(recipeDietaryTags).values(dietaryTagsData);
    }

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${recipeId}`);

    return { success: true, data: { recipeId } };
  } catch (error) {
    console.error("Error updating recipe:", error);
    return {
      success: false,
      error: "Failed to update recipe. Please try again.",
    };
  }
}

/**
 * Delete a recipe
 */
export async function deleteRecipe(
  recipeId: string
): Promise<Result<{ recipeId: string }>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Check if recipe exists and user owns it
    const [existingRecipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!existingRecipe) {
      return { success: false, error: "Recipe not found" };
    }

    if (existingRecipe.userId !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to delete this recipe",
      };
    }

    // Delete recipe (cascade will handle related data)
    await db.delete(recipes).where(eq(recipes.id, recipeId));

    revalidatePath("/recipes");

    return { success: true, data: { recipeId } };
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return {
      success: false,
      error: "Failed to delete recipe. Please try again.",
    };
  }
}
