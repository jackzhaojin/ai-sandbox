/**
 * Error Handling Utilities
 * Centralized error handling and response formatting for API routes
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================================================
// Error Types
// ============================================================================

export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  API_KEY_MISSING = 'API_KEY_MISSING',
  RATE_LIMIT = 'RATE_LIMIT',
  BAD_REQUEST = 'BAD_REQUEST',
}

export interface ApiError {
  success: false;
  error: string;
  code: ErrorCode;
  details?: unknown;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ============================================================================
// Error Response Helpers
// ============================================================================

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  code: ErrorCode,
  status: number,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      details,
    },
    { status }
  );
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

// ============================================================================
// Common Error Responses
// ============================================================================

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return createErrorResponse(message, ErrorCode.UNAUTHORIZED, 401);
}

export function forbiddenResponse(message: string = 'Forbidden') {
  return createErrorResponse(message, ErrorCode.FORBIDDEN, 403);
}

export function notFoundResponse(message: string = 'Not found') {
  return createErrorResponse(message, ErrorCode.NOT_FOUND, 404);
}

export function validationErrorResponse(
  message: string = 'Validation error',
  details?: unknown
) {
  return createErrorResponse(message, ErrorCode.VALIDATION_ERROR, 400, details);
}

export function internalErrorResponse(message: string = 'Internal server error') {
  return createErrorResponse(message, ErrorCode.INTERNAL_ERROR, 500);
}

export function apiKeyMissingResponse() {
  return createErrorResponse(
    'API key not configured',
    ErrorCode.API_KEY_MISSING,
    500
  );
}

export function rateLimitResponse(message: string = 'Rate limit exceeded') {
  return createErrorResponse(message, ErrorCode.RATE_LIMIT, 429);
}

export function badRequestResponse(message: string = 'Bad request', details?: unknown) {
  return createErrorResponse(message, ErrorCode.BAD_REQUEST, 400, details);
}

// ============================================================================
// Error Handler
// ============================================================================

/**
 * Handle errors in API routes with proper logging and response formatting
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  // Log the error
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error);

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return validationErrorResponse('Invalid input', error.issues);
  }

  // Handle known error types
  if (error instanceof Error) {
    // Check for API key issues
    if (error.message.includes('API key') || error.message.includes('ANTHROPIC_API_KEY')) {
      return apiKeyMissingResponse();
    }

    // Check for rate limit
    if (error.message.includes('rate limit')) {
      return rateLimitResponse();
    }

    // Generic error with message
    return internalErrorResponse(
      process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    );
  }

  // Unknown error
  return internalErrorResponse();
}

// ============================================================================
// Validation Helper
// ============================================================================

/**
 * Validate request body with Zod schema
 * Returns parsed data or throws error
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error;
    }
    throw new Error('Invalid request body');
  }
}

// ============================================================================
// Server Action Error Handler
// ============================================================================

/**
 * Handle errors in server actions with proper formatting
 * Returns a standardized error object
 */
export function handleServerActionError(
  error: unknown,
  context?: string
): { success: false; error: string; details?: unknown } {
  // Log the error
  console.error(`Server Action Error${context ? ` in ${context}` : ''}:`, error);

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: 'Invalid input',
      details: error.issues,
    };
  }

  // Handle known error types
  if (error instanceof Error) {
    return {
      success: false,
      error: process.env.NODE_ENV === 'development'
        ? error.message
        : 'An error occurred',
    };
  }

  // Unknown error
  return {
    success: false,
    error: 'An unexpected error occurred',
  };
}

/**
 * Server action success response
 */
export function serverActionSuccess<T>(
  data: T,
  message?: string
): { success: true; data: T; message?: string } {
  return {
    success: true,
    data,
    message,
  };
}
