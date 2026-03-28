/**
 * Individual Report API
 *
 * GET /api/reports/:id - Get a specific report
 * PUT /api/reports/:id - Update a report
 * DELETE /api/reports/:id - Delete a report
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { savedReports } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// ============================================================================
// GET - Get Single Report
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await requireAuth()

    // Get report ID from params
    const { id } = await params

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid report ID format' },
        { status: 400 }
      )
    }

    // Query report
    // User can access their own reports or public reports
    const [report] = await db
      .select()
      .from(savedReports)
      .where(
        and(
          eq(savedReports.id, id),
          eq(savedReports.userId, user.id)
        )
      )
      .limit(1)

    // If not found, check if it's a public report
    if (!report) {
      const [publicReport] = await db
        .select()
        .from(savedReports)
        .where(
          and(
            eq(savedReports.id, id),
            eq(savedReports.isPublic, true)
          )
        )
        .limit(1)

      if (publicReport) {
        return NextResponse.json({
          success: true,
          report: publicReport,
        })
      }

      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle other errors
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT - Update Report
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await requireAuth()

    // Get report ID from params
    const { id } = await params

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid report ID format' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate at least one field is being updated
    if (!body.name && !body.description && !body.config && body.isPublic === undefined) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      )
    }

    // Validate field types if provided
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.length < 1 || body.name.length > 255) {
        return NextResponse.json(
          { error: 'name must be a string between 1 and 255 characters' },
          { status: 400 }
        )
      }
    }

    if (body.description !== undefined && typeof body.description !== 'string') {
      return NextResponse.json(
        { error: 'description must be a string' },
        { status: 400 }
      )
    }

    if (body.config !== undefined && typeof body.config !== 'object') {
      return NextResponse.json(
        { error: 'config must be an object' },
        { status: 400 }
      )
    }

    if (body.isPublic !== undefined && typeof body.isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'isPublic must be a boolean' },
        { status: 400 }
      )
    }

    // Check if report exists and user owns it
    const [existingReport] = await db
      .select()
      .from(savedReports)
      .where(
        and(
          eq(savedReports.id, id),
          eq(savedReports.userId, user.id)
        )
      )
      .limit(1)

    if (!existingReport) {
      return NextResponse.json(
        { error: 'Report not found or you do not have permission to update it' },
        { status: 404 }
      )
    }

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.config !== undefined) updateData.config = body.config
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic

    // Update report
    const [updatedReport] = await db
      .update(savedReports)
      .set(updateData)
      .where(
        and(
          eq(savedReports.id, id),
          eq(savedReports.userId, user.id)
        )
      )
      .returning()

    return NextResponse.json({
      success: true,
      report: updatedReport,
    })
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle other errors
    console.error('Error updating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Delete Report
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await requireAuth()

    // Get report ID from params
    const { id } = await params

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid report ID format' },
        { status: 400 }
      )
    }

    // Check if report exists and user owns it
    const [existingReport] = await db
      .select()
      .from(savedReports)
      .where(
        and(
          eq(savedReports.id, id),
          eq(savedReports.userId, user.id)
        )
      )
      .limit(1)

    if (!existingReport) {
      return NextResponse.json(
        { error: 'Report not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    // Delete report
    await db
      .delete(savedReports)
      .where(
        and(
          eq(savedReports.id, id),
          eq(savedReports.userId, user.id)
        )
      )

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    })
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle other errors
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// Helper: Validate UUID Format
// ============================================================================

function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
