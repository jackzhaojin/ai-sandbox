/**
 * B2B Postal Checkout Flow - API Response Utilities
 * Standardized response format and error handling
 */

import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiErrorCode,
} from '@/types/api';
import { ApiErrorCodes } from '@/types/api';

// ============================================
// HTTP STATUS CODES
// ============================================

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ============================================
// ERROR CODE TO STATUS MAPPING
// ============================================

const errorCodeToStatus: Record<ApiErrorCode, number> = {
  [ApiErrorCodes.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ApiErrorCodes.INVALID_REQUEST]: HttpStatus.BAD_REQUEST,
  [ApiErrorCodes.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ApiErrorCodes.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [ApiErrorCodes.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ApiErrorCodes.METHOD_NOT_ALLOWED]: HttpStatus.METHOD_NOT_ALLOWED,
  [ApiErrorCodes.RATE_LIMITED]: HttpStatus.TOO_MANY_REQUESTS,
  [ApiErrorCodes.VALIDATION_ERROR]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ApiErrorCodes.INVALID_JSON]: HttpStatus.BAD_REQUEST,
  [ApiErrorCodes.MISSING_REQUIRED_FIELD]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ApiErrorCodes.INVALID_FIELD_VALUE]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ApiErrorCodes.SHIPMENT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ApiErrorCodes.SHIPMENT_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ApiErrorCodes.INVALID_SHIPMENT_STATUS]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ApiErrorCodes.CANNOT_UPDATE_SHIPMENT]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ApiErrorCodes.ADDRESS_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ApiErrorCodes.INVALID_ADDRESS]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ApiErrorCodes.DATABASE_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ApiErrorCodes.CONNECTION_ERROR]: HttpStatus.SERVICE_UNAVAILABLE,
};

// ============================================
// SUCCESS RESPONSES
// ============================================

export function successResponse<T>(
  data: T,
  status: number = HttpStatus.OK,
  headers?: Record<string, string>
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  const responseHeaders = new Headers(headers);
  responseHeaders.set('Content-Type', 'application/json');

  return NextResponse.json(response, { status, headers: responseHeaders });
}

export function createdResponse<T>(
  data: T,
  headers?: Record<string, string>
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, HttpStatus.CREATED, headers);
}

// ============================================
// ERROR RESPONSES
// ============================================

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, string[]>,
  customStatus?: number
): NextResponse<ApiErrorResponse> {
  const status = customStatus ?? errorCodeToStatus[code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
  
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(response, { status });
}

// Convenience methods for common errors
export const errors = {
  badRequest: (message: string = 'Invalid request', details?: Record<string, string[]>) =>
    errorResponse(ApiErrorCodes.INVALID_REQUEST, message, details),

  unauthorized: (message: string = 'Unauthorized') =>
    errorResponse(ApiErrorCodes.UNAUTHORIZED, message),

  forbidden: (message: string = 'Forbidden') =>
    errorResponse(ApiErrorCodes.FORBIDDEN, message),

  notFound: (resource: string = 'Resource') =>
    errorResponse(ApiErrorCodes.NOT_FOUND, `${resource} not found`),

  validation: (message: string = 'Validation failed', details?: Record<string, string[]>) =>
    errorResponse(ApiErrorCodes.VALIDATION_ERROR, message, details),

  methodNotAllowed: (allowed: string[]) =>
    errorResponse(
      ApiErrorCodes.METHOD_NOT_ALLOWED,
      `Method not allowed. Allowed: ${allowed.join(', ')}`
    ),

  internal: (message: string = 'Internal server error') =>
    errorResponse(ApiErrorCodes.INTERNAL_ERROR, message),

  database: (message: string = 'Database error') =>
    errorResponse(ApiErrorCodes.DATABASE_ERROR, message),

  shipmentNotFound: () =>
    errorResponse(ApiErrorCodes.SHIPMENT_NOT_FOUND, 'Shipment not found'),

  addressNotFound: () =>
    errorResponse(ApiErrorCodes.ADDRESS_NOT_FOUND, 'Address not found'),

  cannotUpdateShipment: (reason: string) =>
    errorResponse(ApiErrorCodes.CANNOT_UPDATE_SHIPMENT, `Cannot update shipment: ${reason}`),
};

// ============================================
// ZOD ERROR HANDLING
// ============================================

interface ZodIssue {
  path: (string | number)[];
  message: string;
}

export function formatZodError(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  // Zod v4 uses 'issues' instead of 'errors'
  const issues = (error as unknown as { issues?: ZodIssue[] }).issues ?? [];
  
  issues.forEach((err: ZodIssue) => {
    const path = err.path.join('.');
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(err.message);
  });

  return details;
}

export function zodValidationResponse(error: ZodError): NextResponse<ApiErrorResponse> {
  return errors.validation('Validation failed', formatZodError(error));
}

// ============================================
// JSON PARSING
// ============================================

export async function parseJsonBody(request: Request): Promise<
  { success: true; data: unknown } | { success: false; response: NextResponse<ApiErrorResponse> }
> {
  try {
    const data = await request.json();
    return { success: true, data };
  } catch {
    return {
      success: false,
      response: errorResponse(
        ApiErrorCodes.INVALID_JSON,
        'Invalid JSON in request body'
      ),
    };
  }
}

// ============================================
// CACHE HEADERS
// ============================================

export function cacheHeaders(maxAge: number, staleWhileRevalidate?: number): Record<string, string> {
  const directives = [`max-age=${maxAge}`];
  
  if (staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  return {
    'Cache-Control': directives.join(', '),
  };
}

export const noCacheHeaders: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// ============================================
// CORS HEADERS
// ============================================

export function corsHeaders(origin: string = '*'): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ============================================
// API ERROR CLASS
// ============================================

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: Record<string, string[]>,
    public readonly statusCode: number = errorCodeToStatus[code] ?? HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toResponse(): NextResponse<ApiErrorResponse> {
    return errorResponse(this.code, this.message, this.details, this.statusCode);
  }
}

// ============================================
// ASYNC HANDLER WRAPPER
// ============================================

export function asyncHandler<T>(
  handler: (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse<T>>
) {
  return async (
    request: Request,
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse<T | ApiErrorResponse>> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof ApiError) {
        return error.toResponse() as NextResponse<ApiErrorResponse>;
      }

      return errors.internal() as NextResponse<ApiErrorResponse>;
    }
  };
}
