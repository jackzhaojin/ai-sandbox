/**
 * Chat-related TypeScript types
 */

export interface Message {
  id: string;
  conversationId: string;
  senderId: string | null;
  content: string;
  role: 'user' | 'assistant' | 'system';
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  title?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: 'owner' | 'member';
  joinedAt: Date;
  leftAt?: Date | null;
}
