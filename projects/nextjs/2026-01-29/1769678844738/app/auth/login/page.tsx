/**
 * Login Page
 *
 * Allows users to sign in with email and password
 */

import { LoginForm } from '@/components/auth/LoginForm'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Login | Retro Analytics Dashboard',
  description: 'Sign in to your account',
}

export default async function LoginPage() {
  // Redirect if already logged in
  const session = await getSession()
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-500 mb-2 font-mono uppercase">
            RETRO ANALYTICS
          </h1>
          <p className="text-green-400 font-mono">SYSTEM LOGIN</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
