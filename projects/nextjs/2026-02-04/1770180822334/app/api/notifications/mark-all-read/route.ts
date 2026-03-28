import { NextResponse } from 'next/server'
import { getUserProfile } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST() {
  const user = await getUserProfile()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}
