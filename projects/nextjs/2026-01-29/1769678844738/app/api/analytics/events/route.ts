/**
 * Analytics Events API
 *
 * POST /api/analytics/events - Create a new analytics event
 * GET /api/analytics/events - Fetch analytics events (with filters)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { analyticsEvents } from '@/lib/db/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'

// ============================================================================
// POST - Create Analytics Event
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.eventType || typeof body.eventType !== 'string') {
      return NextResponse.json(
        { error: 'eventType is required and must be a string' },
        { status: 400 }
      )
    }

    if (!body.eventName || typeof body.eventName !== 'string') {
      return NextResponse.json(
        { error: 'eventName is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate eventType (allowed values)
    const validEventTypes = [
      'page_view',
      'click',
      'form_submit',
      'error',
      'custom',
      'api_call',
      'performance',
    ]

    if (!validEventTypes.includes(body.eventType)) {
      return NextResponse.json(
        {
          error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Get request metadata
    const headers = request.headers
    const userAgent = headers.get('user-agent') || undefined
    const forwardedFor = headers.get('x-forwarded-for')
    const realIp = headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined

    // Insert analytics event
    const [event] = await db
      .insert(analyticsEvents)
      .values({
        userId: user.id,
        eventType: body.eventType,
        eventName: body.eventName,
        path: body.path || undefined,
        metadata: body.metadata || undefined,
        userAgent: userAgent,
        ipAddress: ipAddress,
        sessionId: body.sessionId || undefined,
        timestamp: body.timestamp ? new Date(body.timestamp) : undefined,
      })
      .returning()

    return NextResponse.json(
      {
        success: true,
        event,
      },
      { status: 201 }
    )
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle other errors
    console.error('Error creating analytics event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Fetch Analytics Events
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('eventType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
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

    // Build query conditions
    const conditions = [eq(analyticsEvents.userId, user.id)]

    // Filter by event type
    if (eventType) {
      conditions.push(eq(analyticsEvents.eventType, eventType))
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate)
      if (isNaN(start.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startDate format' },
          { status: 400 }
        )
      }
      conditions.push(gte(analyticsEvents.timestamp, start))
    }

    if (endDate) {
      const end = new Date(endDate)
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate format' },
          { status: 400 }
        )
      }
      conditions.push(lte(analyticsEvents.timestamp, end))
    }

    // Query events
    const events = await db
      .select()
      .from(analyticsEvents)
      .where(and(...conditions))
      .orderBy(desc(analyticsEvents.timestamp))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const [countResult] = await db
      .select({ count: analyticsEvents.id })
      .from(analyticsEvents)
      .where(and(...conditions))

    return NextResponse.json({
      success: true,
      events,
      pagination: {
        limit,
        offset,
        total: events.length,
      },
    })
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle other errors
    console.error('Error fetching analytics events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
