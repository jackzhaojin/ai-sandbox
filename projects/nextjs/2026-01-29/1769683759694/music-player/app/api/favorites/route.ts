/**
 * Favorites API - Add, remove, and list favorite tracks
 * POST /api/favorites - Add track to favorites
 * DELETE /api/favorites - Remove track from favorites
 * GET /api/favorites - List user's favorite tracks
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
    const { trackId } = body;

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

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_trackId: {
          userId: session.user.id,
          trackId,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Track already in favorites' },
        { status: 409 }
      );
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        trackId,
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

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameter for trackId
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('trackId');

    if (!trackId) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      );
    }

    // Check if favorited
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_trackId: {
          userId: session.user.id,
          trackId,
        },
      },
    });

    if (!favorite) {
      return NextResponse.json(
        { error: 'Track not in favorites' },
        { status: 404 }
      );
    }

    // Remove from favorites
    await prisma.favorite.delete({
      where: {
        userId_trackId: {
          userId: session.user.id,
          trackId,
        },
      },
    });

    return NextResponse.json({
      message: 'Track removed from favorites successfully',
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
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

    // Fetch user's favorites
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
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
        createdAt: 'desc',
      },
      take: Math.min(limit, 100),
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.favorite.count({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      favorites,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + favorites.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}
