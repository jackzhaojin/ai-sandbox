/**
 * API Error Handling Utilities
 *
 * Standardized error responses for API endpoints
 */

import { NextResponse } from 'next/server'

// ============================================================================
// Error Types
// ============================================================================

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class ValidationError extends APIError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends APIError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends APIError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends APIError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends APIError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
    this.name = 'RateLimitError'
  }
}

export class InternalServerError extends APIError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR')
    this.name = 'InternalServerError'
  }
}

// ============================================================================
// Error Response Builder
// ============================================================================

export interface ErrorResponse {
  error: string
  code?: string
  field?: string
  details?: Record<string, unknown>
}

export function errorResponse(
  error: Error | APIError,
  includeStack = false
): NextResponse<ErrorResponse> {
  // Handle APIError instances
  if (error instanceof APIError) {
    const response: ErrorResponse = {
      error: error.message,
      code: error.code,
    }

    if (error instanceof ValidationError && error.field) {
      response.field = error.field
    }

    if (includeStack && process.env.NODE_ENV === 'development') {
      response.details = { stack: error.stack }
    }

    return NextResponse.json(response, { status: error.statusCode })
  }

  // Handle authentication errors
  if (error.message === 'Unauthorized') {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // Handle generic errors
  console.error('Unhandled error:', error)

  const response: ErrorResponse = {
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
  }

  if (includeStack && process.env.NODE_ENV === 'development') {
    response.details = {
      message: error.message,
      stack: error.stack,
    }
  }

  return NextResponse.json(response, { status: 500 })
}

// ============================================================================
// Success Response Builder
// ============================================================================

export interface SuccessResponse<T = unknown> {
  success: true
  data?: T
  message?: string
}

export function successResponse<T>(
  data?: T,
  message?: string,
  status = 200
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = { success: true }

  if (data !== undefined) {
    response.data = data
  }

  if (message) {
    response.message = message
  }

  return NextResponse.json(response, { status })
}

// ============================================================================
// Try-Catch Wrapper for API Routes
// ============================================================================

export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      if (error instanceof Error) {
        return errorResponse(error, true)
      }
      return errorResponse(
        new InternalServerError('An unexpected error occurred'),
        true
      )
    }
  }
}
