import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, activityLog } from '@/lib/db/schema'
import { inArray, eq } from 'drizzle-orm'
import { getUserProfile } from '@/lib/auth/session'

interface BulkActionRequest {
  action: 'archive' | 'delete'
  pageIds: string[]
}

export async function POST(request: NextRequest) {
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
        { error: 'Only admins can perform bulk actions' },
        { status: 403 }
      )
    }

    const body: BulkActionRequest = await request.json()

    // Validate request
    if (!['archive', 'delete'].includes(body.action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "archive" or "delete"' },
        { status: 400 }
      )
    }

    if (!Array.isArray(body.pageIds) || body.pageIds.length === 0) {
      return NextResponse.json(
        { error: 'pageIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Get all pages to verify they exist
    const pagesToProcess = await db.query.pages.findMany({
      where: inArray(pages.id, body.pageIds),
    })

    if (pagesToProcess.length === 0) {
      return NextResponse.json(
        { error: 'No valid pages found' },
        { status: 404 }
      )
    }

    let successCount = 0

    if (body.action === 'archive') {
      // Archive pages
      await db
        .update(pages)
        .set({
          status: 'archived',
          updatedBy: profile.id,
          updatedAt: new Date(),
        })
        .where(inArray(pages.id, body.pageIds))

      successCount = pagesToProcess.length

      // Log activities
      for (const page of pagesToProcess) {
        await db.insert(activityLog).values({
          userId: profile.id,
          siteId: page.siteId,
          entityType: 'page',
          entityId: page.id,
          action: 'archived',
          metadata: {
            bulkAction: true,
            previousStatus: page.status,
          },
        })
      }
    } else if (body.action === 'delete') {
      // Delete pages (soft delete by archiving first, then actual delete)
      // Note: Due to cascade constraints, this will delete related records
      await db.delete(pages).where(inArray(pages.id, body.pageIds))

      successCount = pagesToProcess.length

      // Log activities
      for (const page of pagesToProcess) {
        await db.insert(activityLog).values({
          userId: profile.id,
          siteId: page.siteId,
          entityType: 'page',
          entityId: page.id,
          action: 'deleted',
          metadata: {
            bulkAction: true,
            title: page.title,
            slug: page.slug,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      action: body.action,
      processedCount: successCount,
      totalRequested: body.pageIds.length,
    })
  } catch (error) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}
