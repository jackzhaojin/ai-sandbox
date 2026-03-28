/**
 * Conversations API Routes
 * Handles CRUD operations for conversations
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { createConversationSchema } from '@/lib/validations';
import {
  handleApiError,
  unauthorizedResponse,
  createSuccessResponse,
} from '@/lib/errors';

/**
 * GET /api/conversations
 * List all conversations for the authenticated user
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    // Fetch user's conversations with message count and latest message
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
            leftAt: null, // Only active participants
          },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get latest message only
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
    });

    // Transform the response to include message count and latest message
    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: conv._count.messages,
      latestMessage: conv.messages[0] || null,
    }));

    return createSuccessResponse(formattedConversations);
  } catch (error) {
    return handleApiError(error, 'GET /api/conversations');
  }
}

/**
 * POST /api/conversations
 * Create a new conversation
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    // Parse and validate request body
    const body = await req.json();
    const validated = createConversationSchema.parse(body);

    // Create conversation with user as participant
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
      include: {
        messages: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    return createSuccessResponse(
      {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation._count.messages,
        latestMessage: null,
      },
      201
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/conversations');
  }
}
