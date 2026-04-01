/**
 * Play History API - Record and retrieve play history
 * POST /api/playhistory - Record a track play
 * GET /api/playhistory - Get user's play history
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { trackId, completed } = body;

    // Validate required fields
    if (!trackId || typeof trackId !== 'string') {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      );
    }

    // Verify track exists
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Record play history
    const playHistory = await prisma.playHistory.create({
      data: {
        userId: session.user.id,
        trackId,
        completed: completed === true,
      },
      include: {
        track: {
          include: {
            artist: {
              select: {
                id: true,
                name: true,
              },
            },
            album: {
              select: {
                id: true,
                title: true,
                coverArtUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(playHistory, { status: 201 });
  } catch (error) {
    console.error('Error recording play history:', error);
    return NextResponse.json(
      { error: 'Failed to record play history' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const completedOnly = searchParams.get('completedOnly') === 'true';

    // Build query filter
    const where: any = {
      userId: session.user.id,
    };
    if (completedOnly) {
      where.completed = true;
    }

    // Fetch play history
    const history = await prisma.playHistory.findMany({
      where,
      include: {
        track: {
          include: {
            artist: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
            album: {
              select: {
                id: true,
                title: true,
                coverArtUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        playedAt: 'desc',
      },
      take: Math.min(limit, 100),
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.playHistory.count({ where });

    // Get recently played tracks (unique tracks from last 50 plays)
    const recentUniqueTracks = await prisma.playHistory.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        trackId: true,
        playedAt: true,
      },
      orderBy: {
        playedAt: 'desc',
      },
      take: 50,
      distinct: ['trackId'],
    });

    return NextResponse.json({
      history,
      recentlyPlayed: recentUniqueTracks.map((h) => h.trackId),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + history.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching play history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch play history' },
      { status: 500 }
    );
  }
}
