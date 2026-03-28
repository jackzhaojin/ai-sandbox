import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, profiles } from '@/lib/db/schema'
import { eq, and, or, lt } from 'drizzle-orm'
import { getUserProfile } from '@/lib/auth/session'

const LOCK_TIMEOUT_MINUTES = 30

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    // Get user profile
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { pageId } = await params

    // Check if page exists
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
      with: {
        // Include lock info
      },
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Calculate stale lock threshold (30 minutes ago)
    const staleLockThreshold = new Date(Date.now() - LOCK_TIMEOUT_MINUTES * 60 * 1000)

    // Check if page is locked by another user
    if (page.lockedBy && page.lockedBy !== profile.id && page.lockedAt) {
      // Check if lock is stale
      if (new Date(page.lockedAt) > staleLockThreshold) {
        // Get the user who has the lock
        const lockOwner = await db.query.profiles.findFirst({
          where: eq(profiles.id, page.lockedBy),
        })

        return NextResponse.json(
          {
            error: 'Page is locked by another user',
            locked: true,
            lockedBy: lockOwner?.name || 'Unknown user',
            lockedAt: page.lockedAt,
          },
          { status: 423 } // 423 Locked
        )
      }
    }

    // Lock the page
    await db
      .update(pages)
      .set({
        lockedBy: profile.id,
        lockedAt: new Date(),
        updatedBy: profile.id,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId))

    return NextResponse.json({
      success: true,
      lockedBy: profile.id,
      lockedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error locking page:', error)
    return NextResponse.json(
      { error: 'Failed to lock page' },
      { status: 500 }
    )
  }
}

// Release lock
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    // Get user profile
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { pageId } = await params
    const { force } = await request.json().catch(() => ({ force: false }))

    // Check if page exists
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Check if user can release the lock
    const canRelease = page.lockedBy === profile.id || (force && profile.role === 'admin')

    if (!canRelease) {
      return NextResponse.json(
        { error: 'Cannot release lock - not the lock owner or admin' },
        { status: 403 }
      )
    }

    // Release the lock
    await db
      .update(pages)
      .set({
        lockedBy: null,
        lockedAt: null,
        updatedBy: profile.id,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId))

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error releasing lock:', error)
    return NextResponse.json(
      { error: 'Failed to release lock' },
      { status: 500 }
    )
  }
}

// Check lock status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params

    // Check if page exists
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    let lockOwner = null
    if (page.lockedBy) {
      const owner = await db.query.profiles.findFirst({
        where: eq(profiles.id, page.lockedBy),
      })
      lockOwner = owner?.name || 'Unknown user'
    }

    // Calculate if lock is stale
    const staleLockThreshold = new Date(Date.now() - LOCK_TIMEOUT_MINUTES * 60 * 1000)
    const isStale = page.lockedAt && new Date(page.lockedAt) <= staleLockThreshold

    return NextResponse.json({
      locked: !!page.lockedBy && !isStale,
      lockedBy: page.lockedBy,
      lockedByName: lockOwner,
      lockedAt: page.lockedAt,
      isStale,
    })
  } catch (error) {
    console.error('Error checking lock status:', error)
    return NextResponse.json(
      { error: 'Failed to check lock status' },
      { status: 500 }
    )
  }
}
