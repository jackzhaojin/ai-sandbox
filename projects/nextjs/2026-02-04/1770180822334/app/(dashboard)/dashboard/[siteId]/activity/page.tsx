import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getUserProfile } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { activityLog, profiles, sites } from '@/lib/db/schema'
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm'
import { ActivityFeed } from './activity-feed'

interface PageProps {
  params: Promise<{
    siteId: string
  }>
  searchParams: Promise<{
    action?: string
    userId?: string
    startDate?: string
    endDate?: string
    page?: string
  }>
}

async function getActivityData(
  siteId: string,
  filters: {
    action?: string
    userId?: string
    startDate?: string
    endDate?: string
    page?: string
  }
) {
  const page = parseInt(filters.page || '1')
  const limit = 20
  const offset = (page - 1) * limit

  // Build filter conditions
  const conditions = [eq(activityLog.siteId, siteId)]

  if (filters.action) {
    conditions.push(eq(activityLog.action, filters.action as any))
  }
  if (filters.userId) {
    conditions.push(eq(activityLog.userId, filters.userId))
  }
  if (filters.startDate) {
    conditions.push(gte(activityLog.createdAt, new Date(filters.startDate)))
  }
  if (filters.endDate) {
    conditions.push(lte(activityLog.createdAt, new Date(filters.endDate)))
  }

  // Get activities with user info
  const activities = await db
    .select({
      id: activityLog.id,
      userId: activityLog.userId,
      siteId: activityLog.siteId,
      pageId: activityLog.pageId,
      entityType: activityLog.entityType,
      entityId: activityLog.entityId,
      action: activityLog.action,
      metadata: activityLog.metadata,
      createdAt: activityLog.createdAt,
      userName: profiles.name,
      userEmail: profiles.email,
      userAvatar: profiles.avatarUrl,
    })
    .from(activityLog)
    .leftJoin(profiles, eq(activityLog.userId, profiles.id))
    .where(and(...conditions))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
    .offset(offset)

  // Get total count for pagination
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(activityLog)
    .where(and(...conditions))

  // Get unique users for filter dropdown
  const users = await db
    .selectDistinct({
      id: profiles.id,
      name: profiles.name,
      email: profiles.email,
    })
    .from(activityLog)
    .innerJoin(profiles, eq(activityLog.userId, profiles.id))
    .where(eq(activityLog.siteId, siteId))

  return {
    activities,
    users,
    totalCount: count,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  }
}

export default async function ActivityPage({ params, searchParams }: PageProps) {
  const user = await getUserProfile()
  if (!user) {
    notFound()
  }

  const { siteId } = await params
  const filters = await searchParams

  // Verify site access
  const [site] = await db
    .select()
    .from(sites)
    .where(eq(sites.id, siteId))
    .limit(1)

  if (!site) {
    notFound()
  }

  const data = await getActivityData(siteId, filters)

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <p className="text-gray-600 mt-2">Track all changes and actions in your site</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <ActivityFeed
          initialActivities={data.activities}
          users={data.users}
          siteId={siteId}
          totalPages={data.totalPages}
          currentPage={data.currentPage}
        />
      </Suspense>
    </div>
  )
}
