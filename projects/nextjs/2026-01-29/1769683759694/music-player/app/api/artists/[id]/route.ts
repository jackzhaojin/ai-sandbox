/**
 * Artists API - Get single artist with albums and tracks
 * GET /api/artists/[id]
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

    // Fetch artist with full details
    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        albums: {
          include: {
            _count: {
              select: {
                tracks: true,
              },
            },
          },
          orderBy: {
            releaseDate: 'desc',
          },
        },
        tracks: {
          include: {
            album: {
              select: {
                id: true,
                title: true,
                coverArtUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Limit to 10 most recent tracks
        },
      },
    });

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    return NextResponse.json(artist);
  } catch (error) {
    console.error('Error fetching artist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist' },
      { status: 500 }
    );
  }
}
