/**
 * Session Management Utilities
 *
 * Helper functions for:
 * - Getting current user session
 * - Getting current user from database
 * - Requiring authentication
 */

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { User } from '@/lib/db/schema'

/**
 * Get the current session
 * Use this in Server Components and Route Handlers
 */
export async function getSession() {
  return await auth()
}

/**
 * Get the current user from session
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()

  if (!session?.user?.id) {
    return null
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  return user || null
}

/**
 * Require authentication
 * Throws error if user is not authenticated
 * Use this in Route Handlers and Server Actions
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

/**
 * Check if user is authenticated
 * Returns boolean
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return !!session?.user
}
