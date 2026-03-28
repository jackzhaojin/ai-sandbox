/**
 * Individual Conversation API Routes
 * Handles operations on a specific conversation
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import {
  handleApiError,
  unauthorizedResponse,
  notFoundResponse,
  createSuccessResponse,
} from '@/lib/errors';
import { conversationTitleSchema } from '@/lib/validations';

/**
 * GET /api/conversations/[id]
 * Get a specific conversation with all messages
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    // Fetch conversation with messages
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId: session.user.id,
            leftAt: null,
          },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            role: true,
            createdAt: true,
            metadata: true,
          },
        },
      },
    });

    if (!conversation) {
      return notFoundResponse('Conversation not found');
    }

    return createSuccessResponse({
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/conversations/[id]');
  }
}

/**
 * DELETE /api/conversations/[id]
 * Delete a specific conversation (and all its messages via cascade)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    // Verify user owns/participates in the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!conversation) {
      return notFoundResponse('Conversation not found');
    }

    // Delete conversation (messages will be cascade deleted)
    await prisma.conversation.delete({
      where: { id },
    });

    return createSuccessResponse(
      { id },
      200,
      'Conversation deleted successfully'
    );
  } catch (error) {
    return handleApiError(error, 'DELETE /api/conversations/[id]');
  }
}

/**
 * PATCH /api/conversations/[id]
 * Update conversation title
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const body = await req.json();

    // Validate title if provided
    const title = body.title ? conversationTitleSchema.parse(body.title) : undefined;

    // Verify user owns/participates in the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!conversation) {
      return notFoundResponse('Conversation not found');
    }

    // Update conversation
    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        title: title || conversation.title,
      },
    });

    return createSuccessResponse(updated);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/conversations/[id]');
  }
}
