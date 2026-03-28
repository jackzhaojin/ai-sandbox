/**
 * API request and response types
 */

export interface ChatRequest {
  conversationId: string;
  message: string;
  userId: string;
}

export interface ChatResponse {
  messageId: string;
  content: string;
  role: 'assistant';
  metadata?: Record<string, unknown>;
}

export interface ConversationListResponse {
  conversations: Array<{
    id: string;
    title: string | null;
    lastMessageAt: Date;
    unreadCount: number;
  }>;
}

export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}
