/**
 * Artists API - List all artists
 * GET /api/artists
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
    const search = searchParams.get('search');

    // Build query filters
    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Fetch artists with album and track counts
    const artists = await prisma.artist.findMany({
      where,
      include: {
        _count: {
          select: {
            albums: true,
            tracks: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: Math.min(limit, 100),
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.artist.count({ where });

    return NextResponse.json({
      artists,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + artists.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching artists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artists' },
      { status: 500 }
    );
  }
}
