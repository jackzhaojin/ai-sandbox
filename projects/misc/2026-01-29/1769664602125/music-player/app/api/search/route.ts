import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/search?q=query - Search tracks
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    const db = getDb();

    // Search tracks by title, artist, or album
    const searchPattern = `%${query}%`;
    const tracks = db
      .prepare(
        `SELECT * FROM tracks
         WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
         ORDER BY title ASC
         LIMIT 50`
      )
      .all(searchPattern, searchPattern, searchPattern);

    return NextResponse.json({ tracks, query });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
