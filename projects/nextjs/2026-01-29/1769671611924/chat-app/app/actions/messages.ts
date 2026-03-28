'use server';

/**
 * Server Actions for Message Operations
 * Provides server-side functions for message CRUD and marking messages as read
 */

import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// Validation schemas
const markMessagesReadSchema = z.object({
  conversationId: z.string().uuid(),
  messageIds: z.array(z.string().uuid()).optional(),
});

/**
 * Get messages for a specific conversation
 */
export async function getConversationMessages(conversationId: string, options?: {
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: session.user.id,
            leftAt: null,
          },
        },
      },
    });

    if (!conversation) {
      return {
        success: false,
        error: 'Conversation not found',
      };
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        content: true,
        role: true,
        createdAt: true,
        isRead: true,
        metadata: true,
      },
    });

    return {
      success: true,
      data: messages,
    };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return {
      success: false,
      error: 'Failed to fetch messages',
    };
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(data: {
  conversationId: string;
  messageIds?: string[];
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const validated = markMessagesReadSchema.parse(data);

    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: validated.conversationId,
        participants: {
          some: {
            userId: session.user.id,
            leftAt: null,
          },
        },
      },
    });

    if (!conversation) {
      return {
        success: false,
        error: 'Conversation not found',
      };
    }

    // Build the where clause
    const whereClause: {
      conversationId: string;
      isRead: boolean;
      id?: { in: string[] };
    } = {
      conversationId: validated.conversationId,
      isRead: false,
    };

    // If specific message IDs provided, only mark those
    if (validated.messageIds && validated.messageIds.length > 0) {
      whereClause.id = { in: validated.messageIds };
    }

    const result = await prisma.message.updateMany({
      where: whereClause,
      data: { isRead: true },
    });

    revalidatePath(`/chat/${validated.conversationId}`);

    return {
      success: true,
      count: result.count,
      message: `Marked ${result.count} message(s) as read`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input',
        details: error.issues,
      };
    }

    console.error('Error marking messages as read:', error);
    return {
      success: false,
      error: 'Failed to mark messages as read',
    };
  }
}

/**
 * Get unread message count for a conversation
 */
export async function getUnreadCount(conversationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: session.user.id,
            leftAt: null,
          },
        },
      },
    });

    if (!conversation) {
      return {
        success: false,
        error: 'Conversation not found',
      };
    }

    const count = await prisma.message.count({
      where: {
        conversationId,
        isRead: false,
        role: 'assistant', // Only count assistant messages as unread
      },
    });

    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return {
      success: false,
      error: 'Failed to get unread count',
    };
  }
}

/**
 * Delete a message (soft delete by marking as deleted in metadata)
 */
export async function deleteMessage(messageId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Verify user owns the message or is in the conversation
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversation: {
          participants: {
            some: {
              userId: session.user.id,
              leftAt: null,
            },
          },
        },
      },
    });

    if (!message) {
      return {
        success: false,
        error: 'Message not found',
      };
    }

    // Soft delete by updating metadata
    const metadata = message.metadata ? JSON.parse(message.metadata) : {};
    metadata.deleted = true;
    metadata.deletedAt = new Date().toISOString();

    await prisma.message.update({
      where: { id: messageId },
      data: {
        content: '[Message deleted]',
        metadata: JSON.stringify(metadata),
      },
    });

    revalidatePath(`/chat/${message.conversationId}`);

    return {
      success: true,
      message: 'Message deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting message:', error);
    return {
      success: false,
      error: 'Failed to delete message',
    };
  }
}

/**
 * Get all unread conversations for the user
 */
export async function getUnreadConversations() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
            leftAt: null,
          },
        },
        messages: {
          some: {
            isRead: false,
            role: 'assistant',
          },
        },
      },
      include: {
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                role: 'assistant',
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      unreadCount: conv._count.messages,
    }));

    return {
      success: true,
      data: formattedConversations,
    };
  } catch (error) {
    console.error('Error fetching unread conversations:', error);
    return {
      success: false,
      error: 'Failed to fetch unread conversations',
    };
  }
}
