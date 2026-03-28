/**
 * Logout Page
 *
 * Allows users to sign out
 */

import { LogoutButton } from '@/components/auth/LogoutButton'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Logout | Retro Analytics Dashboard',
  description: 'Sign out of your account',
}

export default async function LogoutPage() {
  // Redirect if not logged in
  const session = await getSession()
  if (!session?.user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-500 mb-2 font-mono uppercase">
            RETRO ANALYTICS
          </h1>
          <p className="text-green-400 font-mono">LOGOUT</p>
        </div>
        <div className="border-2 border-green-500 p-8 bg-black shadow-[0_0_20px_rgba(0,255,0,0.3)]">
          <p className="text-green-400 font-mono text-center mb-6">
            ARE YOU SURE YOU WANT TO SIGN OUT?
          </p>
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
