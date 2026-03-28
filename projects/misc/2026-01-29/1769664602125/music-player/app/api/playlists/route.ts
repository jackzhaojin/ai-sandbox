import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/playlists - List user's playlists
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const playlists = db
      .prepare(
        `SELECT p.*, COUNT(pt.track_id) as track_count
         FROM playlists p
         LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
         WHERE p.user_id = ?
         GROUP BY p.id
         ORDER BY p.created_at DESC`
      )
      .all(userId);

    return NextResponse.json({ playlists });
  } catch (error) {
    console.error('Get playlists error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/playlists - Create new playlist
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const db = getDb();
    const result = db
      .prepare('INSERT INTO playlists (user_id, title, description) VALUES (?, ?, ?)')
      .run(userId, title, description || null);

    const playlist = db
      .prepare('SELECT * FROM playlists WHERE id = ?')
      .get(result.lastInsertRowid);

    return NextResponse.json({ playlist }, { status: 201 });
  } catch (error) {
    console.error('Create playlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
