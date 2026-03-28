/**
 * Chat API Route
 * Handles streaming chat with Claude AI using Claude Agent SDK
 * Supports OAuth token (Claude Pro/Max) and API key authentication
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { query, type SDKMessage, type SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';
import { chatRequestSchema } from '@/lib/validations';
import {
  handleApiError,
  unauthorizedResponse,
  notFoundResponse,
  apiKeyMissingResponse,
} from '@/lib/errors';
import { DEFAULT_MODEL } from '@/lib/anthropic/client';

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

    // Validate authentication credentials are configured (OAuth or API key)
    if (!process.env.CLAUDE_CODE_OAUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
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
    const conversationHistory = conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Build the full prompt with conversation history
    let fullPrompt = message;
    if (conversationHistory.length > 0) {
      const historyText = conversationHistory
        .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');
      fullPrompt = `${historyText}\n\nUser: ${message}`;
    }

    // Store userId and conversationId for use in async completion handler
    const userId = session.user.id;
    const conversationIdForCallback = conversation.id;

    // Query Claude using Agent SDK (supports both OAuth and API key)
    let fullResponse = '';
    try {
      const agentStream = query({
        prompt: fullPrompt,
        options: {
          model: DEFAULT_MODEL,
          maxTurns: 1,
        },
      });

      // Process the streaming response
      for await (const msg of agentStream) {
        const sdkMessage = msg as SDKMessage;

        // Handle result message
        if (sdkMessage.type === 'result') {
          const resultMsg = sdkMessage as SDKResultMessage;
          if (resultMsg.subtype === 'success' && resultMsg.result) {
            fullResponse = resultMsg.result;
          } else {
            // Handle error results
            fullResponse = `Error: ${resultMsg.subtype}`;
          }
        }
      }
    } catch (error) {
      console.error('Agent SDK error:', error);
      fullResponse = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    // Save assistant response to database
    try {
      await prisma.message.create({
        data: {
          conversationId: conversationIdForCallback,
          content: fullResponse,
          role: 'assistant',
          metadata: JSON.stringify({
            model: DEFAULT_MODEL,
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

    // Return the response as plain text
    return new Response(fullResponse, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Conversation-Id': conversation.id,
        'X-Message-Id': userMessage.id,
      },
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/chat');
  }
}
