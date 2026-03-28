import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { webhooks, sites } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { triggerWebhooks } from '@/lib/webhooks'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; webhookId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { siteId, webhookId } = await params

    // Fetch webhook
    const [webhook] = await db
      .select()
      .from(webhooks)
      .where(
        and(eq(webhooks.id, webhookId), eq(webhooks.siteId, siteId))
      )
      .limit(1)

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Fetch site
    const [site] = await db
      .select()
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1)

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Send test webhook (use first event in the list)
    const testEvent = webhook.events[0] as any
    await triggerWebhooks(siteId, site.name, testEvent, {
      test: true,
      message: 'This is a test webhook',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to test webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
