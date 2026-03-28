/**
 * Logout Button Component
 *
 * Client-side button for user logout
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logout } from '@/lib/auth/actions'
import Link from 'next/link'

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    await logout()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="flex gap-4 justify-center">
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className="border-2 border-green-500 bg-black text-green-500 px-6 py-3 font-mono uppercase hover:bg-green-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'LOGGING OUT...' : 'YES, SIGN OUT'}
      </button>
      <Link
        href="/dashboard"
        className="border-2 border-green-500 bg-black text-green-500 px-6 py-3 font-mono uppercase hover:bg-green-500 hover:text-black transition-colors inline-block"
      >
        CANCEL
      </Link>
    </div>
  )
}
