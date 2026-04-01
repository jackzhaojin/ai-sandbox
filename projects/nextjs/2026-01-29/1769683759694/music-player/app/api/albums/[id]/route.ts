/**
 * Albums API - Get single album with tracks
 * GET /api/albums/[id]
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

    // Fetch album with full details and tracks
    const album = await prisma.album.findUnique({
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
        tracks: {
          include: {
            artist: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            trackNumber: 'asc',
          },
        },
      },
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Calculate total duration
    const totalDuration = album.tracks.reduce(
      (sum, track) => sum + track.duration,
      0
    );

    return NextResponse.json({
      ...album,
      totalDuration,
      trackCount: album.tracks.length,
    });
  } catch (error) {
    console.error('Error fetching album:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album' },
      { status: 500 }
    );
  }
}
