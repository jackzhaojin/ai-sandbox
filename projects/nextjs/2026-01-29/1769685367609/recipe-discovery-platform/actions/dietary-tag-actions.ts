"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dietaryTags, type DietaryTag, type NewDietaryTag } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
 * Get all dietary tags
 */
export async function getDietaryTags(): Promise<Result<DietaryTag[]>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const tags = await db.select().from(dietaryTags);

    return { success: true, data: tags };
  } catch (error) {
    console.error("Error fetching dietary tags:", error);
    return {
      success: false,
      error: "Failed to fetch dietary tags. Please try again.",
    };
  }
}

/**
 * Get a dietary tag by ID
 */
export async function getDietaryTagById(
  tagId: string
): Promise<Result<DietaryTag>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const [tag] = await db
      .select()
      .from(dietaryTags)
      .where(eq(dietaryTags.id, tagId))
      .limit(1);

    if (!tag) {
      return { success: false, error: "Dietary tag not found" };
    }

    return { success: true, data: tag };
  } catch (error) {
    console.error("Error fetching dietary tag:", error);
    return {
      success: false,
      error: "Failed to fetch dietary tag. Please try again.",
    };
  }
}

/**
 * Create a new dietary tag
 */
export async function createDietaryTag(input: {
  name: string;
}): Promise<Result<{ tagId: string }>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Dietary tag name is required" };
    }

    // Check if tag already exists
    const [existingTag] = await db
      .select()
      .from(dietaryTags)
      .where(eq(dietaryTags.name, input.name.trim()))
      .limit(1);

    if (existingTag) {
      return {
        success: false,
        error: "A dietary tag with this name already exists",
      };
    }

    // Create dietary tag
    const newTag: NewDietaryTag = {
      name: input.name.trim(),
    };

    const [tag] = await db.insert(dietaryTags).values(newTag).returning();

    return { success: true, data: { tagId: tag.id } };
  } catch (error) {
    console.error("Error creating dietary tag:", error);
    return {
      success: false,
      error: "Failed to create dietary tag. Please try again.",
    };
  }
}
