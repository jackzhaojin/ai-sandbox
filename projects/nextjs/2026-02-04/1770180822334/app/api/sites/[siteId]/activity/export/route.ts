import { NextRequest, NextResponse } from 'next/server'
import { getUserProfile } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { activityLog, profiles } from '@/lib/db/schema'
import { desc, eq, and, gte, lte } from 'drizzle-orm'
import { getActivityDescription } from '@/lib/activity-logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const user = await getUserProfile()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { siteId } = await params
  const searchParams = request.nextUrl.searchParams

  // Build filter conditions
  const conditions = [eq(activityLog.siteId, siteId)]

  const action = searchParams.get('action')
  const userId = searchParams.get('userId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (action) {
    conditions.push(eq(activityLog.action, action as any))
  }
  if (userId) {
    conditions.push(eq(activityLog.userId, userId))
  }
  if (startDate) {
    conditions.push(gte(activityLog.createdAt, new Date(startDate)))
  }
  if (endDate) {
    conditions.push(lte(activityLog.createdAt, new Date(endDate)))
  }

  // Get all activities matching filters
  const activities = await db
    .select({
      id: activityLog.id,
      userId: activityLog.userId,
      entityType: activityLog.entityType,
      entityId: activityLog.entityId,
      action: activityLog.action,
      metadata: activityLog.metadata,
      createdAt: activityLog.createdAt,
      userName: profiles.name,
      userEmail: profiles.email,
    })
    .from(activityLog)
    .leftJoin(profiles, eq(activityLog.userId, profiles.id))
    .where(and(...conditions))
    .orderBy(desc(activityLog.createdAt))
    .limit(1000) // Limit export to 1000 rows

  // Generate CSV
  const csvRows = [
    ['Date', 'User', 'Action', 'Entity Type', 'Entity Name', 'Description'],
  ]

  for (const activity of activities) {
    const date = new Date(activity.createdAt).toISOString()
    const userName = activity.userName || activity.userEmail || 'Unknown'
    const entityName = (activity.metadata as any)?.name || activity.entityType
    const description = getActivityDescription(
      activity.action as any,
      activity.entityType,
      entityName
    )

    csvRows.push([
      date,
      userName,
      activity.action,
      activity.entityType,
      entityName,
      description,
    ])
  }

  const csvContent = csvRows
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="activity-log-${siteId}-${new Date().toISOString()}.csv"`,
    },
  })
}
