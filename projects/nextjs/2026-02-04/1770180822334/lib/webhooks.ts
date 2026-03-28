import { createHmac, randomBytes } from 'crypto'
import { db } from './db'
import { webhooks, webhookDeliveries } from './db/schema'
import { eq, and } from 'drizzle-orm'

export type WebhookEvent =
  | 'page.published'
  | 'page.unpublished'
  | 'page.updated'
  | 'media.uploaded'
  | 'media.deleted'
  | 'fragment.updated'

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  site: {
    id: string
    name: string
  }
  data: Record<string, any>
}

/**
 * Generate a webhook secret
 */
export function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Sign a webhook payload with HMAC-SHA256
 */
export function signWebhookPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Verify a webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = signWebhookPayload(payload, secret)
  return signature === expectedSignature
}

/**
 * Deliver a webhook to a URL
 */
async function deliverWebhook(
  webhookId: string,
  url: string,
  payload: WebhookPayload,
  secret?: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'PageForge-Webhook/1.0',
    }

    // Add signature if secret is provided
    if (secret) {
      const signature = signWebhookPayload(payloadString, secret)
      headers['X-PageForge-Signature'] = signature
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    const responseBody = await response.text().catch(() => '')

    // Record delivery
    await db.insert(webhookDeliveries).values({
      webhookId,
      event: payload.event,
      payload: payload as any,
      responseStatus: response.status,
      responseBody: responseBody.substring(0, 1000), // Limit to 1000 chars
      succeeded: response.ok,
    })

    // Update webhook last triggered
    await db
      .update(webhooks)
      .set({
        lastTriggeredAt: new Date(),
        lastResponseCode: response.status,
      })
      .where(eq(webhooks.id, webhookId))

    return {
      success: response.ok,
      statusCode: response.status,
    }
  } catch (error) {
    console.error('Webhook delivery error:', error)

    // Record failed delivery
    await db.insert(webhookDeliveries).values({
      webhookId,
      event: payload.event,
      payload: payload as any,
      responseStatus: null,
      responseBody: error instanceof Error ? error.message : 'Unknown error',
      succeeded: false,
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Trigger webhooks for a specific event
 */
export async function triggerWebhooks(
  siteId: string,
  siteName: string,
  event: WebhookEvent,
  data: Record<string, any>
): Promise<void> {
  try {
    // Find all active webhooks for this site and event
    const activeWebhooks = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.siteId, siteId), eq(webhooks.isActive, true)))

    // Filter webhooks that listen to this event
    const matchingWebhooks = activeWebhooks.filter(webhook =>
      webhook.events.includes(event)
    )

    if (matchingWebhooks.length === 0) {
      return
    }

    // Construct payload
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      site: {
        id: siteId,
        name: siteName,
      },
      data,
    }

    // Deliver webhooks in parallel (fire and forget)
    const deliveries = matchingWebhooks.map(webhook =>
      deliverWebhook(webhook.id, webhook.url, payload, webhook.secret || undefined)
    )

    // Wait for all deliveries to complete (but don't block the main operation)
    Promise.allSettled(deliveries).catch(err =>
      console.error('Webhook delivery error:', err)
    )
  } catch (error) {
    console.error('Webhook trigger error:', error)
  }
}
