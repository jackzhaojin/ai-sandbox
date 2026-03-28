import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// DELETE /api/playlists/:id/tracks/:trackId - Remove track from playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; trackId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { id, trackId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Verify playlist ownership
    const playlist = db
      .prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?')
      .get(id, userId);

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Remove track from playlist
    const result = db
      .prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?')
      .run(id, trackId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Track not in playlist' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove track from playlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
