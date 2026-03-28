/**
 * Validation Utilities Tests
 */

import {
  isValidUUID,
  isValidDate,
  parseDate,
  validatePagination,
  validateString,
  validateNumber,
  validateBoolean,
  validateObject,
  validateEnum,
  validateBatch,
} from '@/lib/api/validation'

describe('Validation Utilities', () => {
  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('123')).toBe(false)
      expect(isValidUUID('')).toBe(false)
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false)
    })
  })

  describe('isValidDate', () => {
    it('should validate correct dates', () => {
      expect(isValidDate('2024-01-01')).toBe(true)
      expect(isValidDate('2024-01-01T00:00:00Z')).toBe(true)
      expect(isValidDate('2024-12-31')).toBe(true)
    })

    it('should reject invalid dates', () => {
      expect(isValidDate('not-a-date')).toBe(false)
      expect(isValidDate('2024-13-01')).toBe(false)
      expect(isValidDate('')).toBe(false)
    })
  })

  describe('parseDate', () => {
    it('should parse valid dates', () => {
      const date = parseDate('2024-01-01')
      expect(date).toBeInstanceOf(Date)
      expect(date?.toISOString().substring(0, 10)).toBe('2024-01-01')
    })

    it('should return null for invalid dates', () => {
      expect(parseDate('invalid')).toBeNull()
      expect(parseDate('2024-13-01')).toBeNull()
    })
  })

  describe('validatePagination', () => {
    it('should validate correct pagination', () => {
      expect(validatePagination(10, 0)).toBeNull()
      expect(validatePagination(100, 50)).toBeNull()
      expect(validatePagination(1, 0)).toBeNull()
      expect(validatePagination(1000, 0)).toBeNull()
    })

    it('should reject invalid limit', () => {
      const error1 = validatePagination(0, 0)
      expect(error1).not.toBeNull()
      expect(error1?.field).toBe('limit')

      const error2 = validatePagination(1001, 0)
      expect(error2).not.toBeNull()
      expect(error2?.field).toBe('limit')

      const error3 = validatePagination(-1, 0)
      expect(error3).not.toBeNull()
      expect(error3?.field).toBe('limit')
    })

    it('should reject negative offset', () => {
      const error = validatePagination(10, -1)
      expect(error).not.toBeNull()
      expect(error?.field).toBe('offset')
    })

    it('should respect custom maxLimit', () => {
      expect(validatePagination(50, 0, 100)).toBeNull()

      const error = validatePagination(150, 0, 100)
      expect(error).not.toBeNull()
      expect(error?.field).toBe('limit')
    })
  })

  describe('validateString', () => {
    it('should validate required strings', () => {
      expect(validateString('test', 'name', { required: true })).toBeNull()
      expect(validateString('', 'name', { required: true })).toBeNull()
    })

    it('should allow optional strings', () => {
      expect(validateString(undefined, 'name', { required: false })).toBeNull()
      expect(validateString(null, 'name', { required: false })).toBeNull()
    })

    it('should reject missing required strings', () => {
      const error1 = validateString(undefined, 'name', { required: true })
      expect(error1?.field).toBe('name')

      const error2 = validateString(null, 'name', { required: true })
      expect(error2?.field).toBe('name')
    })

    it('should validate minLength', () => {
      expect(validateString('test', 'name', { minLength: 4 })).toBeNull()
      expect(validateString('test', 'name', { minLength: 3 })).toBeNull()

      const error = validateString('ab', 'name', { minLength: 3 })
      expect(error?.field).toBe('name')
      expect(error?.message).toContain('at least 3')
    })

    it('should validate maxLength', () => {
      expect(validateString('test', 'name', { maxLength: 4 })).toBeNull()
      expect(validateString('test', 'name', { maxLength: 10 })).toBeNull()

      const error = validateString('toolong', 'name', { maxLength: 5 })
      expect(error?.field).toBe('name')
      expect(error?.message).toContain('at most 5')
    })

    it('should reject non-string values', () => {
      const error = validateString(123, 'name', { required: true })
      expect(error?.field).toBe('name')
      expect(error?.message).toContain('must be a string')
    })
  })

  describe('validateNumber', () => {
    it('should validate numbers', () => {
      expect(validateNumber(10, 'age', { required: true })).toBeNull()
      expect(validateNumber(0, 'count', { required: true })).toBeNull()
      expect(validateNumber(-5, 'value', { required: true })).toBeNull()
    })

    it('should validate min/max', () => {
      expect(validateNumber(10, 'age', { min: 0, max: 100 })).toBeNull()
      expect(validateNumber(0, 'age', { min: 0 })).toBeNull()
      expect(validateNumber(100, 'age', { max: 100 })).toBeNull()

      const error1 = validateNumber(-1, 'age', { min: 0 })
      expect(error1?.message).toContain('at least 0')

      const error2 = validateNumber(101, 'age', { max: 100 })
      expect(error2?.message).toContain('at most 100')
    })

    it('should validate integer', () => {
      expect(validateNumber(10, 'count', { integer: true })).toBeNull()

      const error = validateNumber(10.5, 'count', { integer: true })
      expect(error?.message).toContain('must be an integer')
    })

    it('should reject NaN', () => {
      const error = validateNumber(NaN, 'value', { required: true })
      expect(error?.message).toContain('valid number')
    })

    it('should allow optional numbers', () => {
      expect(validateNumber(undefined, 'value', { required: false })).toBeNull()
    })
  })

  describe('validateBoolean', () => {
    it('should validate booleans', () => {
      expect(validateBoolean(true, 'active', { required: true })).toBeNull()
      expect(validateBoolean(false, 'active', { required: true })).toBeNull()
    })

    it('should allow optional booleans', () => {
      expect(validateBoolean(undefined, 'active', { required: false })).toBeNull()
    })

    it('should reject non-boolean values', () => {
      const error = validateBoolean('true', 'active', { required: true })
      expect(error?.message).toContain('must be a boolean')
    })
  })

  describe('validateObject', () => {
    it('should validate objects', () => {
      expect(validateObject({}, 'config', { required: true })).toBeNull()
      expect(validateObject({ key: 'value' }, 'config', { required: true })).toBeNull()
    })

    it('should reject arrays', () => {
      const error = validateObject([], 'config', { required: true })
      expect(error?.message).toContain('must be an object')
    })

    it('should allow optional objects', () => {
      expect(validateObject(undefined, 'config', { required: false })).toBeNull()
    })
  })

  describe('validateEnum', () => {
    it('should validate enum values', () => {
      const colors = ['red', 'green', 'blue']
      expect(validateEnum('red', 'color', colors, { required: true })).toBeNull()
      expect(validateEnum('green', 'color', colors, { required: true })).toBeNull()
    })

    it('should reject invalid enum values', () => {
      const colors = ['red', 'green', 'blue']
      const error = validateEnum('yellow', 'color', colors, { required: true })
      expect(error?.message).toContain('must be one of')
      expect(error?.message).toContain('red')
    })

    it('should allow optional enums', () => {
      const colors = ['red', 'green', 'blue']
      expect(validateEnum(undefined, 'color', colors, { required: false })).toBeNull()
    })
  })

  describe('validateBatch', () => {
    it('should filter out null values', () => {
      const validations = [
        null,
        { field: 'name', message: 'Name is required' },
        null,
        { field: 'age', message: 'Age must be positive' },
      ]

      const errors = validateBatch(validations)
      expect(errors).toHaveLength(2)
      expect(errors[0].field).toBe('name')
      expect(errors[1].field).toBe('age')
    })

    it('should return empty array when all validations pass', () => {
      const validations = [null, null, null]
      const errors = validateBatch(validations)
      expect(errors).toHaveLength(0)
    })
  })
})
