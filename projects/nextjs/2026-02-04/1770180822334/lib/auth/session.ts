import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema/profiles'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

/**
 * Get the current session from Supabase
 * Returns null if no session exists
 */
export async function getSession() {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Error getting session:', error)
    return null
  }

  return session
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Error getting user:', error)
    return null
  }

  return user
}

/**
 * Get the current user's profile from the database
 * Returns null if not authenticated or profile not found
 */
export async function getUserProfile() {
  const user = await getUser()

  if (!user) {
    return null
  }

  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.email, user.email!)
    })

    return profile || null
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

/**
 * Require authentication - redirect to login if not authenticated
 * Use this in server components/actions that require auth
 */
export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

/**
 * Require admin role - redirect to dashboard if not admin
 * Use this in server components/actions that require admin access
 */
export async function requireAdmin() {
  const user = await requireAuth()
  const profile = await getUserProfile()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return { user, profile }
}

/**
 * Require editor or admin role - redirect to dashboard if only viewer
 * Use this in server components/actions that require editing permissions
 */
export async function requireEditor() {
  const user = await requireAuth()
  const profile = await getUserProfile()

  if (!profile || profile.role === 'viewer') {
    redirect('/dashboard')
  }

  return { user, profile }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: 'admin' | 'editor' | 'viewer') {
  const profile = await getUserProfile()

  if (!profile) {
    return false
  }

  // Admin has access to everything
  if (profile.role === 'admin') {
    return true
  }

  // Editor has access to editor and viewer
  if (profile.role === 'editor' && (role === 'editor' || role === 'viewer')) {
    return true
  }

  // Exact role match
  return profile.role === role
}

/**
 * Check if user is admin
 */
export async function isAdmin() {
  return hasRole('admin')
}

/**
 * Check if user is editor or admin
 */
export async function isEditor() {
  const profile = await getUserProfile()
  return profile ? (profile.role === 'admin' || profile.role === 'editor') : false
}

/**
 * Update last login timestamp for user profile
 * Call this after successful login
 */
export async function updateLastLogin(email: string) {
  try {
    await db.update(profiles)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(profiles.email, email))
  } catch (error) {
    console.error('Error updating last login:', error)
  }
}
