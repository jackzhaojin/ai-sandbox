import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ingredients } from "@/lib/db/schema";
import { eq, ilike } from "drizzle-orm";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/validation";

/**
 * GET /api/ingredients - List ingredients with optional search and filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "100");

    let query = db.select().from(ingredients);

    // Apply search filter
    if (search) {
      query = query.where(ilike(ingredients.name, `%${search}%`)) as any;
    }

    // Apply category filter
    if (category) {
      query = query.where(eq(ingredients.category, category as any)) as any;
    }

    // Apply limit
    query = query.limit(limit) as any;

    const ingredientsData = await query;

    return createSuccessResponse({
      ingredients: ingredientsData,
      count: ingredientsData.length,
    });
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return createErrorResponse("Failed to fetch ingredients", 500);
  }
}
