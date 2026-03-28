import { describe, it, expect, beforeEach } from 'vitest'
import { z } from 'zod'
import {
  ErrorCode,
  createErrorResponse,
  createSuccessResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
  apiKeyMissingResponse,
  rateLimitResponse,
  badRequestResponse,
  handleApiError,
  handleServerActionError,
  serverActionSuccess,
} from '../errors'

describe('Error Handling Utilities', () => {
  describe('createErrorResponse', () => {
    it('should create a standardized error response', async () => {
      const response = createErrorResponse(
        'Test error',
        ErrorCode.VALIDATION_ERROR,
        400,
        { field: 'email' }
      )

      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json).toEqual({
        success: false,
        error: 'Test error',
        code: ErrorCode.VALIDATION_ERROR,
        details: { field: 'email' },
      })
    })

    it('should work without details', async () => {
      const response = createErrorResponse('Simple error', ErrorCode.NOT_FOUND, 404)

      expect(response.status).toBe(404)

      const json = await response.json()
      expect(json.success).toBe(false)
      expect(json.error).toBe('Simple error')
      expect(json.code).toBe(ErrorCode.NOT_FOUND)
      expect(json.details).toBeUndefined()
    })
  })

  describe('createSuccessResponse', () => {
    it('should create a standardized success response', async () => {
      const data = { id: '123', name: 'Test' }
      const response = createSuccessResponse(data, 200, 'Success message')

      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual({
        success: true,
        data,
        message: 'Success message',
      })
    })

    it('should use default status 200', async () => {
      const response = createSuccessResponse({ test: true })
      expect(response.status).toBe(200)
    })

    it('should work without message', async () => {
      const response = createSuccessResponse({ test: true })
      const json = await response.json()
      expect(json.message).toBeUndefined()
    })
  })

  describe('Common Error Responses', () => {
    it('unauthorizedResponse should return 401', async () => {
      const response = unauthorizedResponse()
      expect(response.status).toBe(401)

      const json = await response.json()
      expect(json.code).toBe(ErrorCode.UNAUTHORIZED)
      expect(json.error).toBe('Unauthorized')
    })

    it('unauthorizedResponse should accept custom message', async () => {
      const response = unauthorizedResponse('Please login')
      const json = await response.json()
      expect(json.error).toBe('Please login')
    })

    it('forbiddenResponse should return 403', async () => {
      const response = forbiddenResponse()
      expect(response.status).toBe(403)

      const json = await response.json()
      expect(json.code).toBe(ErrorCode.FORBIDDEN)
    })

    it('notFoundResponse should return 404', async () => {
      const response = notFoundResponse('Resource not found')
      expect(response.status).toBe(404)

      const json = await response.json()
      expect(json.error).toBe('Resource not found')
    })

    it('validationErrorResponse should return 400 with details', async () => {
      const details = { field: 'email', issue: 'invalid' }
      const response = validationErrorResponse('Invalid email', details)

      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(json.details).toEqual(details)
    })

    it('internalErrorResponse should return 500', async () => {
      const response = internalErrorResponse()
      expect(response.status).toBe(500)

      const json = await response.json()
      expect(json.code).toBe(ErrorCode.INTERNAL_ERROR)
    })

    it('apiKeyMissingResponse should return 500', async () => {
      const response = apiKeyMissingResponse()
      expect(response.status).toBe(500)

      const json = await response.json()
      expect(json.code).toBe(ErrorCode.API_KEY_MISSING)
      expect(json.error).toBe('API key not configured')
    })

    it('rateLimitResponse should return 429', async () => {
      const response = rateLimitResponse()
      expect(response.status).toBe(429)

      const json = await response.json()
      expect(json.code).toBe(ErrorCode.RATE_LIMIT)
    })

    it('badRequestResponse should return 400', async () => {
      const response = badRequestResponse('Invalid data', { reason: 'missing field' })
      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json.code).toBe(ErrorCode.BAD_REQUEST)
      expect(json.details).toEqual({ reason: 'missing field' })
    })
  })

  describe('handleApiError', () => {
    it('should handle Zod validation errors', async () => {
      const schema = z.object({ email: z.string().email() })

      try {
        schema.parse({ email: 'invalid' })
      } catch (error) {
        const response = handleApiError(error, 'test context')
        expect(response.status).toBe(400)

        const json = await response.json()
        expect(json.code).toBe(ErrorCode.VALIDATION_ERROR)
        expect(json.error).toBe('Invalid input')
        expect(json.details).toBeDefined()
      }
    })

    it('should handle API key errors', async () => {
      const error = new Error('API key is missing')
      const response = handleApiError(error)

      expect(response.status).toBe(500)

      const json = await response.json()
      expect(json.code).toBe(ErrorCode.API_KEY_MISSING)
    })

    it('should handle rate limit errors', async () => {
      const error = new Error('rate limit exceeded')
      const response = handleApiError(error)

      expect(response.status).toBe(429)

      const json = await response.json()
      expect(json.code).toBe(ErrorCode.RATE_LIMIT)
    })

    it('should handle generic errors in development', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new Error('Something went wrong')
      const response = handleApiError(error)

      expect(response.status).toBe(500)

      const json = await response.json()
      expect(json.error).toBe('Something went wrong')

      process.env.NODE_ENV = originalEnv
    })

    it('should hide error messages in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = new Error('Internal implementation detail')
      const response = handleApiError(error)

      const json = await response.json()
      expect(json.error).toBe('Internal server error')

      process.env.NODE_ENV = originalEnv
    })

    it('should handle unknown errors', async () => {
      const response = handleApiError('string error')

      expect(response.status).toBe(500)

      const json = await response.json()
      expect(json.code).toBe(ErrorCode.INTERNAL_ERROR)
    })
  })

  describe('handleServerActionError', () => {
    it('should handle Zod validation errors', () => {
      const schema = z.object({ email: z.string().email() })

      try {
        schema.parse({ email: 'invalid' })
      } catch (error) {
        const result = handleServerActionError(error)
        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid input')
        expect(result.details).toBeDefined()
      }
    })

    it('should handle generic errors in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new Error('Test error')
      const result = handleServerActionError(error)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Test error')

      process.env.NODE_ENV = originalEnv
    })

    it('should hide error messages in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = new Error('Internal detail')
      const result = handleServerActionError(error)

      expect(result.success).toBe(false)
      expect(result.error).toBe('An error occurred')

      process.env.NODE_ENV = originalEnv
    })

    it('should handle unknown errors', () => {
      const result = handleServerActionError({ unknown: 'error' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('An unexpected error occurred')
    })
  })

  describe('serverActionSuccess', () => {
    it('should create success response with data', () => {
      const data = { id: '123', name: 'Test' }
      const result = serverActionSuccess(data)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(data)
      expect(result.message).toBeUndefined()
    })

    it('should create success response with data and message', () => {
      const data = { id: '123' }
      const result = serverActionSuccess(data, 'Created successfully')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(data)
      expect(result.message).toBe('Created successfully')
    })
  })
})
