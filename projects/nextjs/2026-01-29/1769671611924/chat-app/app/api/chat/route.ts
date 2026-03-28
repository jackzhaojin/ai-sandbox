/**
 * Chat API Route
 * Handles streaming chat with Claude AI
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { chatRequestSchema } from '@/lib/validations';
import {
  handleApiError,
  unauthorizedResponse,
  notFoundResponse,
  apiKeyMissingResponse,
} from '@/lib/errors';

/**
 * POST /api/chat
 * Send a message and get streaming response from Claude
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    // Validate ANTHROPIC_API_KEY is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return apiKeyMissingResponse();
    }

    // Parse and validate request
    const body = await req.json();
    const { message, conversationId } = chatRequestSchema.parse(body);

    let conversation;

    // Create or get conversation
    if (conversationId) {
      // Verify user has access to this conversation
      conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
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
            take: 20, // Limit to last 20 messages for context
          },
        },
      });

      if (!conversation) {
        return notFoundResponse('Conversation not found');
      }
    } else {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          participants: {
            create: {
              userId: session.user.id,
              role: 'owner',
            },
          },
        },
        include: {
          messages: true,
        },
      });
    }

    // Save user message to database
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        content: message,
        role: 'user',
      },
    });

    // Build conversation history for Claude
    const messages = [
      ...conversation.messages.map((msg) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    // Store userId for use in onFinish callback
    const userId = session.user.id;
    const conversationIdForCallback = conversation.id;

    // Call Claude API with streaming using AI SDK 6.0
    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages,
      maxOutputTokens: 4096,
      async onFinish({ text }) {
        // Save assistant response to database
        try {
          await prisma.message.create({
            data: {
              conversationId: conversationIdForCallback,
              content: text,
              role: 'assistant',
              metadata: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                userId: userId,
              }),
            },
          });

          // Update conversation timestamp
          await prisma.conversation.update({
            where: { id: conversationIdForCallback },
            data: { updatedAt: new Date() },
          });
        } catch (error) {
          console.error('Error saving assistant message:', error);
        }
      },
    });

    // Return streaming response with conversation ID in headers
    return result.toTextStreamResponse({
      headers: {
        'X-Conversation-Id': conversation.id,
        'X-Message-Id': userMessage.id,
      },
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/chat');
  }
}
