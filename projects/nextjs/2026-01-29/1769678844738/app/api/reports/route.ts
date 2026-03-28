/**
 * Saved Reports API
 *
 * GET /api/reports - List user's saved reports
 * POST /api/reports - Create new report
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { savedReports } from '@/lib/db/schema'
import { eq, desc, or, and } from 'drizzle-orm'

// ============================================================================
// GET - List Saved Reports
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const includePublic = searchParams.get('includePublic') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate limit and offset
    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 1000' },
        { status: 400 }
      )
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'offset must be >= 0' },
        { status: 400 }
      )
    }

    // Query reports
    // Include user's own reports and optionally public reports
    const conditions = includePublic
      ? or(
          eq(savedReports.userId, user.id),
          eq(savedReports.isPublic, true)
        )
      : eq(savedReports.userId, user.id)

    const reports = await db
      .select()
      .from(savedReports)
      .where(conditions)
      .orderBy(desc(savedReports.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      success: true,
      reports,
      count: reports.length,
    })
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle other errors
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create Saved Report
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'name is required and must be a string' },
        { status: 400 }
      )
    }

    if (body.name.length < 1 || body.name.length > 255) {
      return NextResponse.json(
        { error: 'name must be between 1 and 255 characters' },
        { status: 400 }
      )
    }

    if (!body.config || typeof body.config !== 'object') {
      return NextResponse.json(
        { error: 'config is required and must be an object' },
        { status: 400 }
      )
    }

    // Validate description if provided
    if (body.description !== undefined && typeof body.description !== 'string') {
      return NextResponse.json(
        { error: 'description must be a string' },
        { status: 400 }
      )
    }

    // Validate isPublic if provided
    if (body.isPublic !== undefined && typeof body.isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'isPublic must be a boolean' },
        { status: 400 }
      )
    }

    // Insert report
    const [report] = await db
      .insert(savedReports)
      .values({
        userId: user.id,
        name: body.name,
        description: body.description || undefined,
        config: body.config,
        isPublic: body.isPublic || false,
      })
      .returning()

    return NextResponse.json(
      {
        success: true,
        report,
      },
      { status: 201 }
    )
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle other errors
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
