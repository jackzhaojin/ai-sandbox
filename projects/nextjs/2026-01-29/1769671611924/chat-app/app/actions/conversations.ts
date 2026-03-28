'use server';

/**
 * Server Actions for Conversation Operations
 * Provides server-side functions for conversation CRUD without explicit API routes
 */

import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// Validation schemas
const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

const updateConversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
});

/**
 * Create a new conversation for the authenticated user
 */
export async function createConversation(data: { title?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const validated = createConversationSchema.parse(data);

    const conversation = await prisma.conversation.create({
      data: {
        title: validated.title || 'New Chat',
        participants: {
          create: {
            userId: session.user.id,
            role: 'owner',
          },
        },
      },
    });

    revalidatePath('/chat');

    return {
      success: true,
      data: conversation,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input',
        details: error.issues,
      };
    }

    console.error('Error creating conversation:', error);
    return {
      success: false,
      error: 'Failed to create conversation',
    };
  }
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(data: { id: string; title: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const validated = updateConversationSchema.parse(data);

    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: validated.id,
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

    const updated = await prisma.conversation.update({
      where: { id: validated.id },
      data: { title: validated.title },
    });

    revalidatePath('/chat');
    revalidatePath(`/chat/${validated.id}`);

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input',
        details: error.issues,
      };
    }

    console.error('Error updating conversation:', error);
    return {
      success: false,
      error: 'Failed to update conversation',
    };
  }
}

/**
 * Delete a conversation (and all its messages via cascade)
 */
export async function deleteConversation(conversationId: string) {
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

    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    revalidatePath('/chat');

    return {
      success: true,
      message: 'Conversation deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return {
      success: false,
      error: 'Failed to delete conversation',
    };
  }
}

/**
 * Leave a conversation (soft delete via leftAt timestamp)
 */
export async function leaveConversation(conversationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Find the participant record
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: session.user.id,
        leftAt: null,
      },
    });

    if (!participant) {
      return {
        success: false,
        error: 'Participant not found',
      };
    }

    // Update leftAt timestamp
    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { leftAt: new Date() },
    });

    revalidatePath('/chat');

    return {
      success: true,
      message: 'Left conversation successfully',
    };
  } catch (error) {
    console.error('Error leaving conversation:', error);
    return {
      success: false,
      error: 'Failed to leave conversation',
    };
  }
}

/**
 * Get user's conversations with pagination
 */
export async function getUserConversations(options?: {
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

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
            leftAt: null,
          },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: conv._count.messages,
      latestMessage: conv.messages[0] || null,
    }));

    return {
      success: true,
      data: formattedConversations,
    };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return {
      success: false,
      error: 'Failed to fetch conversations',
    };
  }
}
