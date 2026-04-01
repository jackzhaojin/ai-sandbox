/**
 * Playlist Tracks API - Add and remove tracks from playlists
 * POST /api/playlists/[id]/tracks - Add track to playlist
 * DELETE /api/playlists/[id]/tracks - Remove track from playlist
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: playlistId } = await params;

    // Parse request body
    const body = await request.json();
    const { trackId, position } = body;

    // Validate required fields
    if (!trackId || typeof trackId !== 'string') {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      );
    }

    // Check playlist ownership
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      select: { userId: true },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify track exists
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Check if track already in playlist
    const existingTrack = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId,
        },
      },
    });

    if (existingTrack) {
      return NextResponse.json(
        { error: 'Track already in playlist' },
        { status: 409 }
      );
    }

    // Get next position if not provided
    let finalPosition = position;
    if (finalPosition === undefined || finalPosition === null) {
      const lastTrack = await prisma.playlistTrack.findFirst({
        where: { playlistId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      finalPosition = lastTrack ? lastTrack.position + 1 : 0;
    }

    // Add track to playlist
    const playlistTrack = await prisma.playlistTrack.create({
      data: {
        playlistId,
        trackId,
        position: finalPosition,
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

    return NextResponse.json(playlistTrack, { status: 201 });
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    return NextResponse.json(
      { error: 'Failed to add track to playlist' },
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

    const { id: playlistId } = await params;

    // Parse query parameter for trackId
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('trackId');

    if (!trackId) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      );
    }

    // Check playlist ownership
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      select: { userId: true },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if track is in playlist
    const playlistTrack = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId,
        },
      },
    });

    if (!playlistTrack) {
      return NextResponse.json(
        { error: 'Track not in playlist' },
        { status: 404 }
      );
    }

    // Remove track from playlist
    await prisma.playlistTrack.delete({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId,
        },
      },
    });

    // Reorder remaining tracks to fill the gap
    await prisma.$executeRaw`
      UPDATE playlist_tracks
      SET position = position - 1
      WHERE playlist_id = ${playlistId}
      AND position > ${playlistTrack.position}
    `;

    return NextResponse.json({
      message: 'Track removed from playlist successfully',
    });
  } catch (error) {
    console.error('Error removing track from playlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove track from playlist' },
      { status: 500 }
    );
  }
}
