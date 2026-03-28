/**
 * Register Page
 *
 * Allows new users to create an account
 */

import { RegisterForm } from '@/components/auth/RegisterForm'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Register | Retro Analytics Dashboard',
  description: 'Create a new account',
}

export default async function RegisterPage() {
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
          <p className="text-green-400 font-mono">NEW USER REGISTRATION</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
