import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/playlists/:id - Get playlist with tracks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Get playlist
    const playlist = db
      .prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?')
      .get(id, userId);

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Get tracks in playlist
    const tracks = db
      .prepare(
        `SELECT t.*, pt.position, pt.added_at
         FROM tracks t
         JOIN playlist_tracks pt ON t.id = pt.track_id
         WHERE pt.playlist_id = ?
         ORDER BY pt.position ASC`
      )
      .all(id);

    return NextResponse.json({ playlist, tracks });
  } catch (error) {
    console.error('Get playlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/playlists/:id - Update playlist
export async function PUT(
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
    const { title, description } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const db = getDb();

    // Verify ownership
    const playlist = db
      .prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?')
      .get(id, userId);

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Update playlist
    db.prepare('UPDATE playlists SET title = ?, description = ? WHERE id = ?').run(
      title,
      description || null,
      id
    );

    const updatedPlaylist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(id);

    return NextResponse.json({ playlist: updatedPlaylist });
  } catch (error) {
    console.error('Update playlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/playlists/:id - Delete playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Verify ownership
    const playlist = db
      .prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?')
      .get(id, userId);

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Delete playlist (cascade will delete playlist_tracks)
    db.prepare('DELETE FROM playlists WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete playlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
