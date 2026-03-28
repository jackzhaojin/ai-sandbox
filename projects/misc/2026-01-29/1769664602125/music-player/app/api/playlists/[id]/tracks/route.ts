import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/playlists/:id/tracks - Add track to playlist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trackId } = body;

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
    }

    const db = getDb();

    // Verify playlist ownership
    const playlist = db
      .prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?')
      .get(id, userId);

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Check if track exists
    const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(trackId);

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Get max position
    const maxPosition = db
      .prepare('SELECT MAX(position) as max FROM playlist_tracks WHERE playlist_id = ?')
      .get(id) as { max: number | null };

    const nextPosition = (maxPosition?.max || -1) + 1;

    // Add track to playlist
    try {
      db.prepare('INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)').run(
        id,
        trackId,
        nextPosition
      );
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ error: 'Track already in playlist' }, { status: 409 });
      }
      throw err;
    }

    return NextResponse.json({ success: true, position: nextPosition }, { status: 201 });
  } catch (error) {
    console.error('Add track to playlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
