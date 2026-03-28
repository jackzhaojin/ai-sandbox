import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { hashApiKey } from './api-keys'

interface RateLimitStore {
  [key: string]: {
    minute: { count: number; resetAt: number }
    hour: { count: number; resetAt: number }
  }
}

const rateLimitStore: RateLimitStore = {}

/**
 * Rate limit configuration
 */
const RATE_LIMITS = {
  perMinute: 100,
  perHour: 1000,
}

/**
 * Check and update rate limits for an API key
 */
function checkRateLimit(keyId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()

  if (!rateLimitStore[keyId]) {
    rateLimitStore[keyId] = {
      minute: { count: 0, resetAt: now + 60000 },
      hour: { count: 0, resetAt: now + 3600000 },
    }
  }

  const limits = rateLimitStore[keyId]

  // Reset minute counter if expired
  if (now > limits.minute.resetAt) {
    limits.minute = { count: 0, resetAt: now + 60000 }
  }

  // Reset hour counter if expired
  if (now > limits.hour.resetAt) {
    limits.hour = { count: 0, resetAt: now + 3600000 }
  }

  // Check limits
  if (limits.minute.count >= RATE_LIMITS.perMinute) {
    return { allowed: false, retryAfter: Math.ceil((limits.minute.resetAt - now) / 1000) }
  }

  if (limits.hour.count >= RATE_LIMITS.perHour) {
    return { allowed: false, retryAfter: Math.ceil((limits.hour.resetAt - now) / 1000) }
  }

  // Increment counters
  limits.minute.count++
  limits.hour.count++

  return { allowed: true }
}

/**
 * Authenticate API request using Bearer token
 */
export async function authenticateApiRequest(request: NextRequest) {
  try {
    // Extract Authorization header
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authenticated: false,
        error: 'Missing or invalid Authorization header',
        status: 401,
      }
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Hash the token
    const keyHash = hashApiKey(token)

    // Look up API key in database
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)))
      .limit(1)

    if (!apiKey) {
      return {
        authenticated: false,
        error: 'Invalid API key',
        status: 401,
      }
    }

    // Check expiration
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return {
        authenticated: false,
        error: 'API key has expired',
        status: 401,
      }
    }

    // Check rate limits
    const rateLimitCheck = checkRateLimit(apiKey.id)
    if (!rateLimitCheck.allowed) {
      return {
        authenticated: false,
        error: 'Rate limit exceeded',
        status: 429,
        retryAfter: rateLimitCheck.retryAfter,
      }
    }

    // Update last used timestamp (fire and forget)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id))
      .execute()
      .catch(err => console.error('Failed to update API key last used:', err))

    return {
      authenticated: true,
      apiKey: {
        id: apiKey.id,
        siteId: apiKey.siteId,
        permissions: apiKey.permissions as Record<string, boolean>,
      },
    }
  } catch (error) {
    console.error('API authentication error:', error)
    return {
      authenticated: false,
      error: 'Internal server error',
      status: 500,
    }
  }
}

/**
 * Middleware wrapper for API routes
 */
export function withApiAuth(
  handler: (
    request: NextRequest,
    context: { params: any; apiKey: { id: string; siteId: string; permissions: Record<string, boolean> } }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params: any }) => {
    const auth = await authenticateApiRequest(request)

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error },
        {
          status: auth.status || 401,
          headers: auth.retryAfter ? { 'Retry-After': String(auth.retryAfter) } : {},
        }
      )
    }

    return handler(request, { ...context, apiKey: auth.apiKey! })
  }
}

/**
 * Check if API key has a specific permission
 */
export function hasPermission(permissions: Record<string, boolean>, permission: string): boolean {
  return permissions[permission] === true
}
