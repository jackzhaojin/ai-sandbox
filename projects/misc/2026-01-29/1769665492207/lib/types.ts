export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  avatar_color: string;
  created_at: number;
}

export interface Conversation {
  id: string;
  title: string;
  created_by: string;
  created_at: number;
  updated_at: number;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'system';
  created_at: number;
}

export interface Reaction {
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: number;
}

export interface MessageWithUser extends Message {
  sender_username: string;
  sender_avatar_color: string;
}

export interface ConversationWithDetails extends Conversation {
  member_count: number;
  last_message?: string;
  last_message_at?: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_color: string;
  created_at: number;
  conversation_count: number;
}

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
}
