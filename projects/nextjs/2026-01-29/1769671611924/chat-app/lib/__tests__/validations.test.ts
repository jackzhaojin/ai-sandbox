import { describe, it, expect } from 'vitest'
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  loginSchema,
  registerSchema,
  conversationTitleSchema,
  createConversationSchema,
  updateConversationSchema,
  conversationIdSchema,
  messageContentSchema,
  messageRoleSchema,
  createMessageSchema,
  chatRequestSchema,
  paginationSchema,
  markMessagesReadSchema,
} from '../validations'

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should accept valid email addresses', () => {
      expect(emailSchema.parse('user@example.com')).toBe('user@example.com')
      expect(emailSchema.parse('test.user+tag@domain.co.uk')).toBe('test.user+tag@domain.co.uk')
    })

    it('should reject invalid email addresses', () => {
      expect(() => emailSchema.parse('invalid-email')).toThrow('Invalid email address')
      expect(() => emailSchema.parse('@example.com')).toThrow()
      expect(() => emailSchema.parse('user@')).toThrow()
    })

    it('should reject emails longer than 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@test.com'
      expect(() => emailSchema.parse(longEmail)).toThrow('Email must be less than 255 characters')
    })
  })

  describe('passwordSchema', () => {
    it('should accept valid passwords', () => {
      expect(passwordSchema.parse('password123')).toBe('password123')
      expect(passwordSchema.parse('Pass@123!')).toBe('Pass@123!')
    })

    it('should reject passwords shorter than 6 characters', () => {
      expect(() => passwordSchema.parse('12345')).toThrow('Password must be at least 6 characters')
    })

    it('should reject passwords longer than 100 characters', () => {
      const longPassword = 'a'.repeat(101)
      expect(() => passwordSchema.parse(longPassword)).toThrow('Password must be less than 100 characters')
    })
  })

  describe('nameSchema', () => {
    it('should accept valid names', () => {
      expect(nameSchema.parse('John Doe')).toBe('John Doe')
      expect(nameSchema.parse('Al')).toBe('Al')
    })

    it('should accept undefined (optional)', () => {
      expect(nameSchema.parse(undefined)).toBeUndefined()
    })

    it('should reject names shorter than 2 characters', () => {
      expect(() => nameSchema.parse('A')).toThrow('Name must be at least 2 characters')
    })

    it('should reject names longer than 100 characters', () => {
      const longName = 'a'.repeat(101)
      expect(() => nameSchema.parse(longName)).toThrow('Name must be less than 100 characters')
    })
  })

  describe('loginSchema', () => {
    it('should accept valid login credentials', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'password123',
      }
      expect(loginSchema.parse(validLogin)).toEqual(validLogin)
    })

    it('should reject invalid email in login', () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: 'password123',
      }
      expect(() => loginSchema.parse(invalidLogin)).toThrow()
    })

    it('should reject missing fields', () => {
      expect(() => loginSchema.parse({ email: 'user@example.com' })).toThrow()
      expect(() => loginSchema.parse({ password: 'password123' })).toThrow()
    })
  })

  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const validRegister = {
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe',
      }
      expect(registerSchema.parse(validRegister)).toEqual(validRegister)
    })

    it('should accept registration without name (optional)', () => {
      const validRegister = {
        email: 'user@example.com',
        password: 'password123',
      }
      expect(registerSchema.parse(validRegister)).toEqual(validRegister)
    })
  })

  describe('conversationTitleSchema', () => {
    it('should accept valid titles', () => {
      expect(conversationTitleSchema.parse('My Conversation')).toBe('My Conversation')
    })

    it('should reject empty titles', () => {
      expect(() => conversationTitleSchema.parse('')).toThrow('Title must not be empty')
    })

    it('should reject titles longer than 200 characters', () => {
      const longTitle = 'a'.repeat(201)
      expect(() => conversationTitleSchema.parse(longTitle)).toThrow('Title must be less than 200 characters')
    })
  })

  describe('conversationIdSchema', () => {
    it('should accept valid UUIDs', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      expect(conversationIdSchema.parse(validUuid)).toBe(validUuid)
    })

    it('should reject invalid UUIDs', () => {
      expect(() => conversationIdSchema.parse('not-a-uuid')).toThrow('Invalid conversation ID')
      expect(() => conversationIdSchema.parse('123')).toThrow()
    })
  })

  describe('messageContentSchema', () => {
    it('should accept valid messages', () => {
      expect(messageContentSchema.parse('Hello, world!')).toBe('Hello, world!')
    })

    it('should reject empty messages', () => {
      expect(() => messageContentSchema.parse('')).toThrow('Message cannot be empty')
    })

    it('should reject messages longer than 10,000 characters', () => {
      const longMessage = 'a'.repeat(10001)
      expect(() => messageContentSchema.parse(longMessage)).toThrow('Message must be less than 10,000 characters')
    })

    it('should accept messages with special characters and emojis', () => {
      const message = 'Hello! 👋 How are you? 😊'
      expect(messageContentSchema.parse(message)).toBe(message)
    })
  })

  describe('messageRoleSchema', () => {
    it('should accept valid roles', () => {
      expect(messageRoleSchema.parse('user')).toBe('user')
      expect(messageRoleSchema.parse('assistant')).toBe('assistant')
      expect(messageRoleSchema.parse('system')).toBe('system')
    })

    it('should reject invalid roles', () => {
      expect(() => messageRoleSchema.parse('invalid')).toThrow()
    })
  })

  describe('createMessageSchema', () => {
    it('should accept valid message creation data', () => {
      const validMessage = {
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        content: 'Hello!',
        role: 'user' as const,
      }
      expect(createMessageSchema.parse(validMessage)).toEqual(validMessage)
    })

    it('should default role to "user" if not provided', () => {
      const message = {
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        content: 'Hello!',
      }
      const parsed = createMessageSchema.parse(message)
      expect(parsed.role).toBe('user')
    })
  })

  describe('chatRequestSchema', () => {
    it('should accept valid chat request', () => {
      const validRequest = {
        message: 'Hello, Claude!',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }
      expect(chatRequestSchema.parse(validRequest)).toEqual(validRequest)
    })

    it('should accept chat request without conversationId (new conversation)', () => {
      const validRequest = {
        message: 'Hello, Claude!',
      }
      expect(chatRequestSchema.parse(validRequest)).toEqual(validRequest)
    })

    it('should reject empty messages', () => {
      expect(() => chatRequestSchema.parse({ message: '' })).toThrow()
    })
  })

  describe('paginationSchema', () => {
    it('should apply default values', () => {
      const result = paginationSchema.parse({})
      expect(result.limit).toBe(20)
      expect(result.offset).toBe(0)
    })

    it('should accept valid pagination parameters', () => {
      const params = { limit: 50, offset: 10 }
      expect(paginationSchema.parse(params)).toEqual(params)
    })

    it('should coerce string numbers to integers', () => {
      const params = { limit: '30', offset: '5' }
      const result = paginationSchema.parse(params)
      expect(result.limit).toBe(30)
      expect(result.offset).toBe(5)
    })

    it('should reject limit greater than 100', () => {
      expect(() => paginationSchema.parse({ limit: 101 })).toThrow()
    })

    it('should reject negative offset', () => {
      expect(() => paginationSchema.parse({ offset: -1 })).toThrow()
    })
  })

  describe('markMessagesReadSchema', () => {
    it('should accept valid mark messages read data', () => {
      const validData = {
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        messageIds: [
          '123e4567-e89b-12d3-a456-426614174001',
          '123e4567-e89b-12d3-a456-426614174002',
        ],
      }
      expect(markMessagesReadSchema.parse(validData)).toEqual(validData)
    })

    it('should accept without messageIds (mark all as read)', () => {
      const validData = {
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }
      expect(markMessagesReadSchema.parse(validData)).toEqual(validData)
    })

    it('should reject invalid conversation ID', () => {
      const invalidData = {
        conversationId: 'not-a-uuid',
        messageIds: [],
      }
      expect(() => markMessagesReadSchema.parse(invalidData)).toThrow()
    })
  })
})
