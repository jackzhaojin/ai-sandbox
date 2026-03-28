import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, reviewRequests, notifications, activityLog } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getUserProfile } from '@/lib/auth/session'

interface ReviewActionRequest {
  action: 'approve' | 'reject'
  reviewerNotes?: string
  reviewRequestId: string
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
        { error: 'Only admins can review pages' },
        { status: 403 }
      )
    }

    const { pageId } = await params
    const body: ReviewActionRequest = await request.json()

    // Validate request
    if (!['approve', 'reject'].includes(body.action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
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

    // Check if page is in_review status
    if (page.status !== 'in_review') {
      return NextResponse.json(
        { error: 'Page must be in review status' },
        { status: 400 }
      )
    }

    // Get the review request
    const reviewRequest = await db.query.reviewRequests.findFirst({
      where: and(
        eq(reviewRequests.id, body.reviewRequestId),
        eq(reviewRequests.pageId, pageId),
        eq(reviewRequests.status, 'pending')
      ),
    })

    if (!reviewRequest) {
      return NextResponse.json(
        { error: 'Review request not found or already resolved' },
        { status: 404 }
      )
    }

    // Update based on action
    if (body.action === 'approve') {
      // Update page status to published
      await db
        .update(pages)
        .set({
          status: 'published',
          publishedAt: new Date(),
          publishedBy: profile.id,
          updatedBy: profile.id,
          updatedAt: new Date(),
        })
        .where(eq(pages.id, pageId))

      // Update review request
      await db
        .update(reviewRequests)
        .set({
          status: 'approved',
          reviewedBy: profile.id,
          reviewerNotes: body.reviewerNotes || null,
          resolvedAt: new Date(),
        })
        .where(eq(reviewRequests.id, body.reviewRequestId))

      // Notify the author
      await db.insert(notifications).values({
        userId: reviewRequest.requestedBy,
        type: 'review_approved',
        title: 'Page review approved',
        message: `Your page "${page.title}" has been approved and published`,
        link: `/dashboard/${page.siteId}/pages/${pageId}`,
        isRead: false,
      })

      // Log activity
      await db.insert(activityLog).values({
        userId: profile.id,
        siteId: page.siteId,
        entityType: 'page',
        entityId: pageId,
        action: 'published',
        metadata: {
          reviewRequestId: body.reviewRequestId,
          reviewerNotes: body.reviewerNotes,
          approvedBy: profile.id,
        },
      })
    } else {
      // Reject - return to draft
      await db
        .update(pages)
        .set({
          status: 'draft',
          updatedBy: profile.id,
          updatedAt: new Date(),
        })
        .where(eq(pages.id, pageId))

      // Update review request
      await db
        .update(reviewRequests)
        .set({
          status: 'rejected',
          reviewedBy: profile.id,
          reviewerNotes: body.reviewerNotes || null,
          resolvedAt: new Date(),
        })
        .where(eq(reviewRequests.id, body.reviewRequestId))

      // Notify the author
      await db.insert(notifications).values({
        userId: reviewRequest.requestedBy,
        type: 'review_rejected',
        title: 'Page review rejected',
        message: `Your page "${page.title}" needs changes before publishing`,
        link: `/dashboard/${page.siteId}/pages/${pageId}`,
        isRead: false,
      })

      // Log activity
      await db.insert(activityLog).values({
        userId: profile.id,
        siteId: page.siteId,
        entityType: 'page',
        entityId: pageId,
        action: 'review_rejected',
        metadata: {
          reviewRequestId: body.reviewRequestId,
          reviewerNotes: body.reviewerNotes,
          rejectedBy: profile.id,
        },
      })
    }

    return NextResponse.json({
      success: true,
      action: body.action,
    })
  } catch (error) {
    console.error('Error processing review:', error)
    return NextResponse.json(
      { error: 'Failed to process review' },
      { status: 500 }
    )
  }
}
