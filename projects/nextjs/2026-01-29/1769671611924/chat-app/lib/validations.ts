/**
 * Validation Schemas
 * Centralized Zod schemas for request validation across the application
 */

import { z } from 'zod';

// ============================================================================
// User & Authentication Schemas
// ============================================================================

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password must be less than 100 characters');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .optional();

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

// ============================================================================
// Conversation Schemas
// ============================================================================

export const conversationTitleSchema = z
  .string()
  .min(1, 'Title must not be empty')
  .max(200, 'Title must be less than 200 characters');

export const createConversationSchema = z.object({
  title: conversationTitleSchema.optional(),
});

export const updateConversationSchema = z.object({
  id: z.string().uuid('Invalid conversation ID'),
  title: conversationTitleSchema,
});

export const conversationIdSchema = z.string().uuid('Invalid conversation ID');

// ============================================================================
// Message Schemas
// ============================================================================

export const messageContentSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(10000, 'Message must be less than 10,000 characters');

export const messageRoleSchema = z.enum(['user', 'assistant', 'system']);

export const createMessageSchema = z.object({
  conversationId: conversationIdSchema,
  content: messageContentSchema,
  role: messageRoleSchema.default('user'),
});

export const messageIdSchema = z.string().uuid('Invalid message ID');

// ============================================================================
// Chat API Schemas
// ============================================================================

export const chatRequestSchema = z.object({
  message: messageContentSchema,
  conversationId: conversationIdSchema.optional(),
});

// ============================================================================
// Pagination Schemas
// ============================================================================

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// ============================================================================
// Mark Messages Read Schema
// ============================================================================

export const markMessagesReadSchema = z.object({
  conversationId: conversationIdSchema,
  messageIds: z.array(messageIdSchema).optional(),
});

// ============================================================================
// Helper Types (inferred from schemas)
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type MarkMessagesReadInput = z.infer<typeof markMessagesReadSchema>;
