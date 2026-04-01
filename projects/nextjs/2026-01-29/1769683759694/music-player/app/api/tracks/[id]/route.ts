/**
 * Tracks API - Get single track by ID
 * GET /api/tracks/[id]
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch track with full details
    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            bio: true,
          },
        },
        album: {
          select: {
            id: true,
            title: true,
            coverArtUrl: true,
            releaseDate: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Check if track is in user's favorites
    const isFavorite = await prisma.favorite.findUnique({
      where: {
        userId_trackId: {
          userId: session.user.id,
          trackId: id,
        },
      },
    });

    return NextResponse.json({
      ...track,
      isFavorite: !!isFavorite,
    });
  } catch (error) {
    console.error('Error fetching track:', error);
    return NextResponse.json(
      { error: 'Failed to fetch track' },
      { status: 500 }
    );
  }
}
