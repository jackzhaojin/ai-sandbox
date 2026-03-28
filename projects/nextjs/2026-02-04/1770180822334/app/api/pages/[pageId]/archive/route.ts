import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, activityLog } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getUserProfile } from '@/lib/auth/session'

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

    // Check if user is admin
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can archive pages' },
        { status: 403 }
      )
    }

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

    if (page.status === 'archived') {
      return NextResponse.json(
        { error: 'Page is already archived' },
        { status: 400 }
      )
    }

    const previousStatus = page.status

    // Archive the page
    await db
      .update(pages)
      .set({
        status: 'archived',
        updatedBy: profile.id,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId))

    // Log activity
    await db.insert(activityLog).values({
      userId: profile.id,
      siteId: page.siteId,
      entityType: 'page',
      entityId: pageId,
      action: 'archived',
      metadata: {
        previousStatus,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error archiving page:', error)
    return NextResponse.json(
      { error: 'Failed to archive page' },
      { status: 500 }
    )
  }
}

// Restore from archive
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

    // Check if user is admin
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can restore pages' },
        { status: 403 }
      )
    }

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

    if (page.status !== 'archived') {
      return NextResponse.json(
        { error: 'Page is not archived' },
        { status: 400 }
      )
    }

    // Restore the page to draft
    await db
      .update(pages)
      .set({
        status: 'draft',
        updatedBy: profile.id,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId))

    // Log activity
    await db.insert(activityLog).values({
      userId: profile.id,
      siteId: page.siteId,
      entityType: 'page',
      entityId: pageId,
      action: 'restored',
      metadata: {
        restoredFrom: 'archived',
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error restoring page:', error)
    return NextResponse.json(
      { error: 'Failed to restore page' },
      { status: 500 }
    )
  }
}
