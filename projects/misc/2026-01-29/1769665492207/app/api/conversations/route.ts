import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser, generateId } from '@/lib/auth';
import type { Conversation, ConversationWithDetails } from '@/lib/types';

// GET /api/conversations - List user's conversations
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = db
      .prepare(
        `
        SELECT
          c.*,
          (SELECT COUNT(*) FROM conversation_members WHERE conversation_id = c.id) as member_count,
          (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
        FROM conversations c
        INNER JOIN conversation_members cm ON c.id = cm.conversation_id
        WHERE cm.user_id = ?
        ORDER BY c.updated_at DESC
      `
      )
      .all(currentUser.userId) as ConversationWithDetails[];

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, initialMessage } = await request.json();

    if (!title || !initialMessage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const conversationId = generateId();
    const now = Date.now();

    // Create conversation
    db.prepare(
      'INSERT INTO conversations (id, title, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(conversationId, title, currentUser.userId, now, now);

    // Add creator as admin
    db.prepare(
      'INSERT INTO conversation_members (conversation_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)'
    ).run(conversationId, currentUser.userId, 'admin', now);

    // Add initial message
    const messageId = generateId();
    db.prepare(
      'INSERT INTO messages (id, conversation_id, sender_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(messageId, conversationId, currentUser.userId, initialMessage, 'text', now);

    // Trigger bot response after delay
    setTimeout(() => {
      triggerBotResponse(conversationId);
    }, Math.random() * 3000 + 2000); // 2-5 seconds

    const conversation = db
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .get(conversationId) as Conversation;

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bot response helper
function triggerBotResponse(conversationId: string) {
  const botResponses = [
    "That's interesting! Tell me more.",
    "I see what you mean. How do you feel about that?",
    "Great point! What do you think we should do next?",
    "Hmm, I'm not sure I understand. Can you elaborate?",
    "That makes sense. Have you considered the alternatives?",
    "Absolutely! I agree with you on that.",
    "That's a good question. Let me think about it.",
    "Interesting perspective! I hadn't thought of it that way.",
    "You're right! What else should we discuss?",
    "I appreciate your input. What's your take on this?",
  ];

  const response = botResponses[Math.floor(Math.random() * botResponses.length)];

  // Get the bot user (we'll create it in seed script)
  const bot = db.prepare("SELECT id FROM users WHERE email = 'bot@chat.app'").get() as { id: string } | undefined;

  if (!bot) return;

  const messageId = generateId();
  const now = Date.now();

  db.prepare(
    'INSERT INTO messages (id, conversation_id, sender_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(messageId, conversationId, bot.id, response, 'text', now);

  // Update conversation updated_at
  db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversationId);
}
