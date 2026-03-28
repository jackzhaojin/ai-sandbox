/**
 * Integration tests for Chat API endpoint
 * Tests /api/chat route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { chatRequestSchema } from '../validations'

describe('Chat API Integration', () => {
  describe('chatRequestSchema validation', () => {
    it('should validate valid chat request', () => {
      const validRequest = {
        message: 'Hello, Claude!',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }
      expect(() => chatRequestSchema.parse(validRequest)).not.toThrow()
    })

    it('should validate request without conversationId', () => {
      const validRequest = {
        message: 'Hello, Claude!',
      }
      expect(() => chatRequestSchema.parse(validRequest)).not.toThrow()
    })

    it('should reject empty message', () => {
      const invalidRequest = {
        message: '',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }
      expect(() => chatRequestSchema.parse(invalidRequest)).toThrow()
    })

    it('should reject message over 10000 characters', () => {
      const invalidRequest = {
        message: 'a'.repeat(10001),
      }
      expect(() => chatRequestSchema.parse(invalidRequest)).toThrow()
    })

    it('should reject invalid UUID for conversationId', () => {
      const invalidRequest = {
        message: 'Hello',
        conversationId: 'not-a-uuid',
      }
      expect(() => chatRequestSchema.parse(invalidRequest)).toThrow()
    })

    it('should allow exactly 10000 characters', () => {
      const validRequest = {
        message: 'a'.repeat(10000),
      }
      expect(() => chatRequestSchema.parse(validRequest)).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle messages with special characters', () => {
      const request = {
        message: 'Hello! @#$%^&*() <script>alert("xss")</script>',
      }
      const result = chatRequestSchema.parse(request)
      expect(result.message).toBe(request.message)
    })

    it('should handle messages with emojis', () => {
      const request = {
        message: 'Hello 👋 World 🌍 Test 🧪',
      }
      const result = chatRequestSchema.parse(request)
      expect(result.message).toBe(request.message)
    })

    it('should handle messages with newlines', () => {
      const request = {
        message: 'Line 1\nLine 2\nLine 3',
      }
      const result = chatRequestSchema.parse(request)
      expect(result.message).toBe(request.message)
    })

    it('should keep leading/trailing whitespace in message', () => {
      const request = {
        message: '  Hello World  ',
      }
      const result = chatRequestSchema.parse(request)
      expect(result.message).toBe('  Hello World  ')
    })

    it('should handle Unicode characters', () => {
      const request = {
        message: 'Hello 你好 مرحبا Здравствуй',
      }
      const result = chatRequestSchema.parse(request)
      expect(result.message).toBe(request.message)
    })
  })
})
