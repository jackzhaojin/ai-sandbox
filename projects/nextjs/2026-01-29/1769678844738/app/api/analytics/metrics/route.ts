/**
 * Analytics Metrics API
 *
 * GET /api/analytics/metrics - Fetch aggregated metrics
 * POST /api/analytics/metrics - Create/update aggregated metrics (admin/background job)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { analyticsMetrics, analyticsEvents } from '@/lib/db/schema'
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'

// ============================================================================
// GET - Fetch Aggregated Metrics
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const metricType = searchParams.get('metricType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')
    const aggregate = searchParams.get('aggregate') === 'true'

    // Validate limit
    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 1000' },
        { status: 400 }
      )
    }

    // If aggregate is true, generate metrics from events in real-time
    if (aggregate) {
      return await getAggregatedMetrics(user.id, {
        metricType,
        startDate,
        endDate,
      })
    }

    // Otherwise, fetch pre-aggregated metrics from analytics_metrics table
    const conditions = []

    // Filter by metric type
    if (metricType) {
      conditions.push(eq(analyticsMetrics.metricType, metricType))
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
      conditions.push(gte(analyticsMetrics.startTime, start))
    }

    if (endDate) {
      const end = new Date(endDate)
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate format' },
          { status: 400 }
        )
      }
      conditions.push(lte(analyticsMetrics.endTime, end))
    }

    // Query metrics
    const metrics =
      conditions.length > 0
        ? await db
            .select()
            .from(analyticsMetrics)
            .where(and(...conditions))
            .orderBy(desc(analyticsMetrics.startTime))
            .limit(limit)
        : await db
            .select()
            .from(analyticsMetrics)
            .orderBy(desc(analyticsMetrics.startTime))
            .limit(limit)

    return NextResponse.json({
      success: true,
      metrics,
      count: metrics.length,
    })
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle other errors
    console.error('Error fetching analytics metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create/Update Aggregated Metrics
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.metricType || typeof body.metricType !== 'string') {
      return NextResponse.json(
        { error: 'metricType is required and must be a string' },
        { status: 400 }
      )
    }

    if (!body.metricName || typeof body.metricName !== 'string') {
      return NextResponse.json(
        { error: 'metricName is required and must be a string' },
        { status: 400 }
      )
    }

    if (body.metricValue === undefined || typeof body.metricValue !== 'number') {
      return NextResponse.json(
        { error: 'metricValue is required and must be a number' },
        { status: 400 }
      )
    }

    if (!body.startTime) {
      return NextResponse.json(
        { error: 'startTime is required' },
        { status: 400 }
      )
    }

    if (!body.endTime) {
      return NextResponse.json(
        { error: 'endTime is required' },
        { status: 400 }
      )
    }

    // Parse dates
    const startTime = new Date(body.startTime)
    const endTime = new Date(body.endTime)

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for startTime or endTime' },
        { status: 400 }
      )
    }

    // Insert metric
    const [metric] = await db
      .insert(analyticsMetrics)
      .values({
        metricType: body.metricType,
        metricName: body.metricName,
        metricValue: body.metricValue.toString(),
        dimensions: body.dimensions || undefined,
        startTime,
        endTime,
      })
      .returning()

    return NextResponse.json(
      {
        success: true,
        metric,
      },
      { status: 201 }
    )
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle other errors
    console.error('Error creating analytics metric:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// Helper: Get Aggregated Metrics from Events
// ============================================================================

async function getAggregatedMetrics(
  userId: string,
  filters: {
    metricType?: string | null
    startDate?: string | null
    endDate?: string | null
  }
) {
  try {
    // Build conditions for events query
    const conditions = [eq(analyticsEvents.userId, userId)]

    if (filters.startDate) {
      const start = new Date(filters.startDate)
      conditions.push(gte(analyticsEvents.timestamp, start))
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate)
      conditions.push(lte(analyticsEvents.timestamp, end))
    }

    // Aggregate metrics by event type
    const eventTypeCounts = await db
      .select({
        eventType: analyticsEvents.eventType,
        count: sql<number>`count(*)::int`,
      })
      .from(analyticsEvents)
      .where(and(...conditions))
      .groupBy(analyticsEvents.eventType)

    // Aggregate metrics by event name
    const eventNameCounts = await db
      .select({
        eventType: analyticsEvents.eventType,
        eventName: analyticsEvents.eventName,
        count: sql<number>`count(*)::int`,
      })
      .from(analyticsEvents)
      .where(and(...conditions))
      .groupBy(analyticsEvents.eventType, analyticsEvents.eventName)
      .orderBy(desc(sql`count(*)`))
      .limit(50)

    // Aggregate metrics by path
    const pathCounts = await db
      .select({
        path: analyticsEvents.path,
        count: sql<number>`count(*)::int`,
      })
      .from(analyticsEvents)
      .where(and(...conditions))
      .groupBy(analyticsEvents.path)
      .orderBy(desc(sql`count(*)`))
      .limit(50)

    // Get total events count
    const [totalResult] = await db
      .select({
        total: sql<number>`count(*)::int`,
      })
      .from(analyticsEvents)
      .where(and(...conditions))

    return NextResponse.json({
      success: true,
      metrics: {
        total: totalResult?.total || 0,
        byEventType: eventTypeCounts,
        byEventName: eventNameCounts,
        byPath: pathCounts.filter((p: { path: string | null; count: number }) => p.path !== null),
      },
    })
  } catch (error) {
    console.error('Error aggregating metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
