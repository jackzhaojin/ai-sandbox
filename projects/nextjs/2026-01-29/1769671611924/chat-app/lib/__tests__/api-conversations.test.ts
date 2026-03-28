/**
 * Integration tests for Conversations API
 * Tests /api/conversations routes
 */

import { describe, it, expect } from 'vitest'
import { createConversationSchema, updateConversationSchema } from '../validations'

describe('Conversations API Integration', () => {
  describe('createConversationSchema validation', () => {
    it('should validate conversation with title', () => {
      const validRequest = {
        title: 'My Chat',
      }
      expect(() => createConversationSchema.parse(validRequest)).not.toThrow()
    })

    it('should validate conversation without title', () => {
      const validRequest = {}
      const result = createConversationSchema.parse(validRequest)
      expect(result).toEqual({})
    })

    it('should reject title over 200 characters', () => {
      const invalidRequest = {
        title: 'a'.repeat(201),
      }
      expect(() => createConversationSchema.parse(invalidRequest)).toThrow()
    })

    it('should accept title of exactly 200 characters', () => {
      const validRequest = {
        title: 'a'.repeat(200),
      }
      expect(() => createConversationSchema.parse(validRequest)).not.toThrow()
    })

    it('should keep leading/trailing whitespace in title', () => {
      const request = {
        title: '  My Chat  ',
      }
      const result = createConversationSchema.parse(request)
      expect(result.title).toBe('  My Chat  ')
    })
  })

  describe('updateConversationSchema validation', () => {
    it('should validate valid update request', () => {
      const validRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Updated Title',
      }
      expect(() => updateConversationSchema.parse(validRequest)).not.toThrow()
    })

    it('should reject missing id', () => {
      const invalidRequest = {
        title: 'Updated Title',
      }
      expect(() => updateConversationSchema.parse(invalidRequest)).toThrow()
    })

    it('should reject invalid UUID', () => {
      const invalidRequest = {
        id: 'not-a-uuid',
        title: 'Updated Title',
      }
      expect(() => updateConversationSchema.parse(invalidRequest)).toThrow()
    })

    it('should reject missing title', () => {
      const invalidRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      }
      expect(() => updateConversationSchema.parse(invalidRequest)).toThrow()
    })

    it('should reject empty title', () => {
      const invalidRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '',
      }
      expect(() => updateConversationSchema.parse(invalidRequest)).toThrow()
    })

    it('should reject title over 200 characters', () => {
      const invalidRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'a'.repeat(201),
      }
      expect(() => updateConversationSchema.parse(invalidRequest)).toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle title with special characters', () => {
      const request = {
        title: 'Chat #1: Q&A Session!',
      }
      const result = createConversationSchema.parse(request)
      expect(result.title).toBe('Chat #1: Q&A Session!')
    })

    it('should handle title with emojis', () => {
      const request = {
        title: '🚀 Project Discussion 💬',
      }
      const result = createConversationSchema.parse(request)
      expect(result.title).toBe('🚀 Project Discussion 💬')
    })

    it('should handle title with Unicode', () => {
      const request = {
        title: 'Chat 你好 مرحبا Здравствуй',
      }
      const result = createConversationSchema.parse(request)
      expect(result.title).toBe('Chat 你好 مرحبا Здравствуй')
    })
  })
})
