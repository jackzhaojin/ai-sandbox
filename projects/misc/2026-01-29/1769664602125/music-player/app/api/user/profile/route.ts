import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/user/profile - Get user profile with stats
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Get user info
    const user = db
      .prepare('SELECT id, email, username, created_at FROM users WHERE id = ?')
      .get(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get playlist count
    const playlistCount = db
      .prepare('SELECT COUNT(*) as count FROM playlists WHERE user_id = ?')
      .get(userId) as { count: number };

    // Get saved tracks count
    const savedTracksCount = db
      .prepare('SELECT COUNT(*) as count FROM user_library WHERE user_id = ?')
      .get(userId) as { count: number };

    return NextResponse.json({
      user,
      stats: {
        playlistCount: playlistCount.count,
        savedTracksCount: savedTracksCount.count,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
