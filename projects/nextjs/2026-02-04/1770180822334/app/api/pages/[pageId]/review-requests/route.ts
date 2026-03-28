import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reviewRequests, pages, profiles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getUserProfile } from '@/lib/auth/session'

export async function GET(
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

    // Get all review requests for this page
    const requests = await db
      .select({
        id: reviewRequests.id,
        pageId: reviewRequests.pageId,
        versionId: reviewRequests.versionId,
        requestedBy: reviewRequests.requestedBy,
        assignedTo: reviewRequests.assignedTo,
        reviewedBy: reviewRequests.reviewedBy,
        status: reviewRequests.status,
        comments: reviewRequests.comments,
        reviewerNotes: reviewRequests.reviewerNotes,
        createdAt: reviewRequests.createdAt,
        resolvedAt: reviewRequests.resolvedAt,
        authorName: profiles.name,
        pageTitle: pages.title,
      })
      .from(reviewRequests)
      .leftJoin(profiles, eq(reviewRequests.requestedBy, profiles.id))
      .leftJoin(pages, eq(reviewRequests.pageId, pages.id))
      .where(eq(reviewRequests.pageId, pageId))
      .orderBy(reviewRequests.createdAt)

    return NextResponse.json({
      reviewRequests: requests,
    })
  } catch (error) {
    console.error('Error fetching review requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review requests' },
      { status: 500 }
    )
  }
}
