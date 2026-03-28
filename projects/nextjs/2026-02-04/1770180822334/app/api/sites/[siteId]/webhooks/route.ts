import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { webhooks } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateWebhookSecret } from '@/lib/webhooks'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { siteId } = await params

    const webhooksList = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.siteId, siteId))
      .orderBy(webhooks.createdAt)

    return NextResponse.json(webhooksList)
  } catch (error) {
    console.error('Failed to fetch webhooks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { siteId } = await params
    const body = await request.json()
    const { name, url, events } = body

    if (!name || !url || !events || events.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate secret for webhook signing
    const secret = generateWebhookSecret()

    const [newWebhook] = await db
      .insert(webhooks)
      .values({
        siteId,
        name,
        url,
        events,
        secret,
        isActive: true,
        createdBy: user.id,
      })
      .returning()

    return NextResponse.json(newWebhook, { status: 201 })
  } catch (error) {
    console.error('Failed to create webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
