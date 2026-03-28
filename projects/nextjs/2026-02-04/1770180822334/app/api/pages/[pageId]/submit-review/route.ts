import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, reviewRequests, pageVersions, notifications, activityLog } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getUserProfile } from '@/lib/auth/session'

interface SubmitReviewRequest {
  comments?: string
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

    const { pageId } = await params
    const body: SubmitReviewRequest = await request.json()

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

    // Check if page is in draft status
    if (page.status !== 'draft') {
      return NextResponse.json(
        { error: 'Page must be in draft status to submit for review' },
        { status: 400 }
      )
    }

    // Get the latest version
    const latestVersion = await db.query.pageVersions.findFirst({
      where: eq(pageVersions.pageId, pageId),
      orderBy: [desc(pageVersions.versionNumber)],
    })

    if (!latestVersion) {
      return NextResponse.json(
        { error: 'No version found for this page' },
        { status: 404 }
      )
    }

    // Update page status to in_review
    await db
      .update(pages)
      .set({
        status: 'in_review',
        updatedBy: profile.id,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId))

    // Create review request
    const reviewRequest = await db
      .insert(reviewRequests)
      .values({
        pageId,
        versionId: latestVersion.id,
        requestedBy: profile.id,
        status: 'pending',
        comments: body.comments || null,
      })
      .returning()

    // Get all admin users for notifications
    const { eq: eqOp } = await import('drizzle-orm')
    const { profiles } = await import('@/lib/db/schema')
    const adminProfiles = await db.select().from(profiles).where(eqOp(profiles.role, 'admin'))

    // Create notifications for admins
    for (const admin of adminProfiles) {
      await db.insert(notifications).values({
        userId: admin.id,
        type: 'review_submitted',
        title: 'New page review request',
        message: `${profile.name} submitted "${page.title}" for review`,
        link: `/dashboard/${page.siteId}/pages/${pageId}`,
        isRead: false,
      })
    }

    // Log activity
    await db.insert(activityLog).values({
      userId: profile.id,
      siteId: page.siteId,
      entityType: 'page',
      entityId: pageId,
      action: 'submitted_for_review',
      metadata: {
        reviewRequestId: reviewRequest[0].id,
        comments: body.comments,
      },
    })

    return NextResponse.json({
      success: true,
      reviewRequest: reviewRequest[0],
    })
  } catch (error) {
    console.error('Error submitting page for review:', error)
    return NextResponse.json(
      { error: 'Failed to submit page for review' },
      { status: 500 }
    )
  }
}
