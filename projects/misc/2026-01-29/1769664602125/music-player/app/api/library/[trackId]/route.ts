import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/library/:trackId - Save track to library
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { trackId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Check if track exists
    const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(trackId);

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Add to library
    try {
      db.prepare('INSERT INTO user_library (user_id, track_id) VALUES (?, ?)').run(
        userId,
        trackId
      );
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ error: 'Track already in library' }, { status: 409 });
      }
      throw err;
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Save track to library error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/library/:trackId - Remove track from library
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { trackId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    const result = db
      .prepare('DELETE FROM user_library WHERE user_id = ? AND track_id = ?')
      .run(userId, trackId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Track not in library' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove track from library error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
