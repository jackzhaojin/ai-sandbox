/**
 * Tracks API - List all tracks
 * GET /api/tracks
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const artistId = searchParams.get('artistId');
    const albumId = searchParams.get('albumId');
    const search = searchParams.get('search');

    // Build query filters
    const where: any = {};
    if (artistId) where.artistId = artistId;
    if (albumId) where.albumId = albumId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch tracks with artist and album info
    const tracks = await prisma.track.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 100), // Max 100 items per request
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.track.count({ where });

    return NextResponse.json({
      tracks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + tracks.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}
