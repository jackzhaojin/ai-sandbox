import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/library - Get user's saved tracks
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    const tracks = db
      .prepare(
        `SELECT t.*, ul.saved_at
         FROM tracks t
         JOIN user_library ul ON t.id = ul.track_id
         WHERE ul.user_id = ?
         ORDER BY ul.saved_at DESC`
      )
      .all(userId);

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Get library error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
