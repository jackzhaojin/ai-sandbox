import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { Conversation } from '@/lib/types';

// GET /api/conversations/:id - Get conversation details
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

    // Check if user is a member
    const member = db
      .prepare('SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?')
      .get(id, currentUser.userId);

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const conversation = db
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .get(id) as Conversation | undefined;

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get members
    const members = db
      .prepare(
        `
        SELECT u.id, u.username, u.avatar_color, cm.role
        FROM users u
        INNER JOIN conversation_members cm ON u.id = cm.user_id
        WHERE cm.conversation_id = ?
      `
      )
      .all(id);

    return NextResponse.json({ conversation, members });
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/:id - Delete conversation (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is admin
    const member = db
      .prepare('SELECT role FROM conversation_members WHERE conversation_id = ? AND user_id = ?')
      .get(id, currentUser.userId) as { role: string } | undefined;

    if (!member || member.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete conversation (cascades to members and messages)
    db.prepare('DELETE FROM conversations WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
