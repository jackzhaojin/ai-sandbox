/**
 * Playlists API - Create and list playlists
 * POST /api/playlists - Create new playlist
 * GET /api/playlists - List user's playlists
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
    const { name, description, isPublic, coverImageUrl } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Playlist name is required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Playlist name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Create playlist
    const playlist = await prisma.playlist.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: isPublic === true,
        coverImageUrl: coverImageUrl || null,
      },
      include: {
        _count: {
          select: {
            tracks: true,
          },
        },
      },
    });

    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to create playlist' },
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
    const includePublic = searchParams.get('includePublic') === 'true';

    // Build query filter
    const where: any = {
      OR: [
        { userId: session.user.id }, // User's own playlists
      ],
    };

    // Optionally include public playlists from other users
    if (includePublic) {
      where.OR.push({ isPublic: true });
    }

    // Fetch playlists with track counts
    const playlists = await prisma.playlist.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            tracks: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ playlists });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}
