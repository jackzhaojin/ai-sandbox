import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dietaryTags } from "@/lib/db/schema";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/validation";

/**
 * GET /api/dietary-tags - List all dietary tags
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const tags = await db.select().from(dietaryTags);

    return createSuccessResponse({
      dietaryTags: tags,
      count: tags.length,
    });
  } catch (error) {
    console.error("Error fetching dietary tags:", error);
    return createErrorResponse("Failed to fetch dietary tags", 500);
  }
}
