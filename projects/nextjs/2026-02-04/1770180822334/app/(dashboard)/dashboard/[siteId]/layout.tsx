import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { getUserProfile } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { sites, notifications } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function SiteDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ siteId: string }>
}) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  const { siteId } = await params

  // Fetch sites from the database
  const sitesList = await db
    .select({
      id: sites.id,
      name: sites.name,
      slug: sites.slug,
      domain: sites.domain,
    })
    .from(sites)
    .where(eq(sites.id, siteId))
    .limit(1)
    .catch(() => [])

  // Fetch recent unread notifications
  const userNotifications = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, profile.id),
        eq(notifications.isRead, false)
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(10)
    .catch(() => [])

  return (
    <DashboardShell
      siteId={siteId}
      sites={sitesList.length > 0 ? sitesList : [{ id: siteId, name: 'My Website', slug: 'my-website', domain: 'mywebsite.com' }]}
      userName={profile.name}
      userEmail={profile.email}
      userAvatarUrl={profile.avatarUrl}
      userRole={profile.role}
      notifications={userNotifications}
    >
      {children}
    </DashboardShell>
  )
}
