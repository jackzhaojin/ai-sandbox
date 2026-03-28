import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, activityLog } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getUserProfile } from '@/lib/auth/session'

interface SchedulePublishRequest {
  scheduledAt: string // ISO date string
}

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
        { error: 'Only admins can schedule publishing' },
        { status: 403 }
      )
    }

    const { pageId } = await params
    const body: SchedulePublishRequest = await request.json()

    // Validate scheduled time
    const scheduledDate = new Date(body.scheduledAt)
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

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

    // Update page with scheduled publish time
    await db
      .update(pages)
      .set({
        status: 'scheduled',
        scheduledPublishAt: scheduledDate,
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
      action: 'scheduled',
      metadata: {
        scheduledAt: scheduledDate.toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      scheduledAt: scheduledDate.toISOString(),
    })
  } catch (error) {
    console.error('Error scheduling page:', error)
    return NextResponse.json(
      { error: 'Failed to schedule page' },
      { status: 500 }
    )
  }
}

// Cancel scheduled publishing
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
        { error: 'Only admins can cancel scheduled publishing' },
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

    if (page.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Page is not scheduled' },
        { status: 400 }
      )
    }

    // Update page to draft status
    await db
      .update(pages)
      .set({
        status: 'draft',
        scheduledPublishAt: null,
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
      action: 'schedule_cancelled',
      metadata: {
        previousScheduledAt: page.scheduledPublishAt?.toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error cancelling schedule:', error)
    return NextResponse.json(
      { error: 'Failed to cancel schedule' },
      { status: 500 }
    )
  }
}
