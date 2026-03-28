/**
 * API Request Validation Utilities
 *
 * Reusable validation functions for API endpoints
 */

// ============================================================================
// UUID Validation
// ============================================================================

export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// ============================================================================
// Date Validation
// ============================================================================

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

export function parseDate(dateString: string): Date | null {
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? null : date
}

// ============================================================================
// Pagination Validation
// ============================================================================

export interface PaginationParams {
  limit: number
  offset: number
}

export interface ValidationError {
  field: string
  message: string
}

export function validatePagination(
  limit: number,
  offset: number,
  maxLimit = 1000
): ValidationError | null {
  if (limit < 1 || limit > maxLimit) {
    return {
      field: 'limit',
      message: `limit must be between 1 and ${maxLimit}`,
    }
  }

  if (offset < 0) {
    return {
      field: 'offset',
      message: 'offset must be >= 0',
    }
  }

  return null
}

// ============================================================================
// String Validation
// ============================================================================

export function validateString(
  value: unknown,
  fieldName: string,
  options?: {
    required?: boolean
    minLength?: number
    maxLength?: number
  }
): ValidationError | null {
  const { required = false, minLength = 0, maxLength = Infinity } = options || {}

  if (value === undefined || value === null) {
    if (required) {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
      }
    }
    return null
  }

  if (typeof value !== 'string') {
    return {
      field: fieldName,
      message: `${fieldName} must be a string`,
    }
  }

  if (value.length < minLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${minLength} characters`,
    }
  }

  if (value.length > maxLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be at most ${maxLength} characters`,
    }
  }

  return null
}

// ============================================================================
// Number Validation
// ============================================================================

export function validateNumber(
  value: unknown,
  fieldName: string,
  options?: {
    required?: boolean
    min?: number
    max?: number
    integer?: boolean
  }
): ValidationError | null {
  const { required = false, min = -Infinity, max = Infinity, integer = false } =
    options || {}

  if (value === undefined || value === null) {
    if (required) {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
      }
    }
    return null
  }

  if (typeof value !== 'number') {
    return {
      field: fieldName,
      message: `${fieldName} must be a number`,
    }
  }

  if (isNaN(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid number`,
    }
  }

  if (integer && !Number.isInteger(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be an integer`,
    }
  }

  if (value < min) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${min}`,
    }
  }

  if (value > max) {
    return {
      field: fieldName,
      message: `${fieldName} must be at most ${max}`,
    }
  }

  return null
}

// ============================================================================
// Boolean Validation
// ============================================================================

export function validateBoolean(
  value: unknown,
  fieldName: string,
  options?: {
    required?: boolean
  }
): ValidationError | null {
  const { required = false } = options || {}

  if (value === undefined || value === null) {
    if (required) {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
      }
    }
    return null
  }

  if (typeof value !== 'boolean') {
    return {
      field: fieldName,
      message: `${fieldName} must be a boolean`,
    }
  }

  return null
}

// ============================================================================
// Object Validation
// ============================================================================

export function validateObject(
  value: unknown,
  fieldName: string,
  options?: {
    required?: boolean
  }
): ValidationError | null {
  const { required = false } = options || {}

  if (value === undefined || value === null) {
    if (required) {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
      }
    }
    return null
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be an object`,
    }
  }

  return null
}

// ============================================================================
// Enum Validation
// ============================================================================

export function validateEnum<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: T[],
  options?: {
    required?: boolean
  }
): ValidationError | null {
  const { required = false } = options || {}

  if (value === undefined || value === null) {
    if (required) {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
      }
    }
    return null
  }

  if (typeof value !== 'string') {
    return {
      field: fieldName,
      message: `${fieldName} must be a string`,
    }
  }

  if (!allowedValues.includes(value as T)) {
    return {
      field: fieldName,
      message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
    }
  }

  return null
}

// ============================================================================
// Batch Validation
// ============================================================================

export function validateBatch(
  validations: (ValidationError | null)[]
): ValidationError[] {
  return validations.filter((error): error is ValidationError => error !== null)
}
