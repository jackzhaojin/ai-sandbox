/**
 * Albums API - List all albums
 * GET /api/albums
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
    const search = searchParams.get('search');

    // Build query filters
    const where: any = {};
    if (artistId) where.artistId = artistId;
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    // Fetch albums with artist info and track count
    const albums = await prisma.album.findMany({
      where,
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            tracks: true,
          },
        },
      },
      orderBy: {
        releaseDate: 'desc',
      },
      take: Math.min(limit, 100),
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.album.count({ where });

    return NextResponse.json({
      albums,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + albums.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    );
  }
}
