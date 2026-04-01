/**
 * Session Management Utilities
 * Helper functions for working with NextAuth sessions
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Get the current server-side session
 * Use this in Server Components and API routes
 * @returns Session object or null if not authenticated
 */
export async function getServerSession() {
  return await auth();
}

/**
 * Require authentication for a page
 * Redirects to signin page if not authenticated
 * Use this in Server Components that require auth
 * @returns Session object (guaranteed to be non-null)
 */
export async function requireAuth() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  return session;
}

/**
 * Get the current user ID from session
 * @returns User ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Check if user is authenticated
 * @returns True if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session?.user;
}
