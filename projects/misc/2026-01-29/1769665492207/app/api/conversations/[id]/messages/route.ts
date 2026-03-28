import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser, generateId } from '@/lib/auth';
import type { MessageWithUser } from '@/lib/types';

// GET /api/conversations/:id/messages - Get messages with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // cursor-based pagination

    // Check if user is a member
    const member = db
      .prepare('SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?')
      .get(id, currentUser.userId);

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let query = `
      SELECT
        m.*,
        u.username as sender_username,
        u.avatar_color as sender_avatar_color
      FROM messages m
      INNER JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
    `;

    const queryParams: any[] = [id];

    if (before) {
      query += ' AND m.created_at < ?';
      queryParams.push(parseInt(before));
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?';
    queryParams.push(limit);

    const messages = db.prepare(query).all(...queryParams) as MessageWithUser[];

    // Reverse to show oldest first
    messages.reverse();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/:id/messages - Send message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Check if user is a member
    const member = db
      .prepare('SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?')
      .get(id, currentUser.userId);

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messageId = generateId();
    const now = Date.now();

    // Insert message
    db.prepare(
      'INSERT INTO messages (id, conversation_id, sender_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(messageId, id, currentUser.userId, content.trim(), 'text', now);

    // Update conversation updated_at
    db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, id);

    // Get the message with user info
    const message = db
      .prepare(
        `
        SELECT
          m.*,
          u.username as sender_username,
          u.avatar_color as sender_avatar_color
        FROM messages m
        INNER JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `
      )
      .get(messageId) as MessageWithUser;

    // Trigger bot response after random delay (2-5 seconds)
    setTimeout(() => {
      triggerBotResponse(id);
    }, Math.random() * 3000 + 2000);

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Send message error:', error);
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

  // Get the bot user
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
