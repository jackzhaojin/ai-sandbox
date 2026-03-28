/**
 * Validation utilities for API endpoints
 */

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate recipe difficulty level
 */
export function isValidDifficulty(
  difficulty: string
): difficulty is "easy" | "medium" | "hard" {
  return ["easy", "medium", "hard"].includes(difficulty);
}

/**
 * Validate ingredient category
 */
export function isValidIngredientCategory(category: string): boolean {
  return [
    "vegetable",
    "fruit",
    "protein",
    "dairy",
    "grain",
    "spice",
    "condiment",
    "oil",
    "sweetener",
    "other",
  ].includes(category);
}

/**
 * Validate measurement unit
 */
export function isValidUnit(unit: string): boolean {
  return [
    "cup",
    "tbsp",
    "tsp",
    "gram",
    "kg",
    "oz",
    "lb",
    "ml",
    "liter",
    "pinch",
    "piece",
    "whole",
    "to_taste",
  ].includes(unit);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

/**
 * Validate positive integer
 */
export function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

/**
 * Validate non-negative integer
 */
export function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Validate rating (1-5)
 */
export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/**
 * Validate string length
 */
export function isValidLength(
  value: string,
  min: number,
  max: number
): boolean {
  const length = value.trim().length;
  return length >= min && length <= max;
}

/**
 * Validate array is not empty
 */
export function isNonEmptyArray<T>(arr: T[]): boolean {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Error response helper
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 400
) {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(data: T, statusCode: number = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    }),
    {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
