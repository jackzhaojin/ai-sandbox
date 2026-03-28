import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { webhookDeliveries } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; webhookId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { webhookId } = await params

    const deliveries = await db
      .select({
        id: webhookDeliveries.id,
        event: webhookDeliveries.event,
        deliveredAt: webhookDeliveries.deliveredAt,
        responseStatus: webhookDeliveries.responseStatus,
        succeeded: webhookDeliveries.succeeded,
      })
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.webhookId, webhookId))
      .orderBy(desc(webhookDeliveries.deliveredAt))
      .limit(20)

    return NextResponse.json(deliveries)
  } catch (error) {
    console.error('Failed to fetch webhook deliveries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
