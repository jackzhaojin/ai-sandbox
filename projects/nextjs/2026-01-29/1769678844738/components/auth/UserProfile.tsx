/**
 * User Profile Component
 *
 * Displays current user information and logout button
 */

import { getCurrentUser } from '@/lib/auth/session'
import Link from 'next/link'

export async function UserProfile() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  return (
    <div className="border-2 border-green-500 p-4 bg-black shadow-[0_0_20px_rgba(0,255,0,0.3)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-green-400 font-mono text-sm uppercase mb-1">
            User
          </p>
          <p className="text-green-500 font-mono text-lg">
            {user.name || user.email}
          </p>
          <p className="text-green-600 font-mono text-xs">{user.email}</p>
        </div>
        <Link
          href="/auth/logout"
          className="border-2 border-green-500 bg-black text-green-500 px-4 py-2 font-mono uppercase hover:bg-green-500 hover:text-black transition-colors text-sm"
        >
          LOGOUT
        </Link>
      </div>
    </div>
  )
}
