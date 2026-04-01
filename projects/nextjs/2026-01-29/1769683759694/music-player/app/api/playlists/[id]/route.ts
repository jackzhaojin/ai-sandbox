/**
 * Playlists API - Get, update, delete single playlist
 * GET /api/playlists/[id] - Get playlist details
 * PUT /api/playlists/[id] - Update playlist
 * DELETE /api/playlists/[id] - Delete playlist
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

    // Fetch playlist with tracks
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        tracks: {
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
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Check if user can access this playlist
    if (playlist.userId !== session.user.id && !playlist.isPublic) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate total duration
    const totalDuration = playlist.tracks.reduce(
      (sum, pt) => sum + pt.track.duration,
      0
    );

    return NextResponse.json({
      ...playlist,
      totalDuration,
      trackCount: playlist.tracks.length,
    });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Check ownership
    const existingPlaylist = await prisma.playlist.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingPlaylist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (existingPlaylist.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { name, description, isPublic, coverImageUrl } = body;

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Playlist name cannot be empty' },
          { status: 400 }
        );
      }
      if (name.length > 100) {
        return NextResponse.json(
          { error: 'Playlist name must be 100 characters or less' },
          { status: 400 }
        );
      }
    }

    // Update playlist
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (isPublic !== undefined) updateData.isPublic = isPublic === true;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl || null;

    const playlist = await prisma.playlist.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            tracks: true,
          },
        },
      },
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check ownership
    const existingPlaylist = await prisma.playlist.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingPlaylist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (existingPlaylist.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete playlist (cascade will delete PlaylistTrack entries)
    await prisma.playlist.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}
