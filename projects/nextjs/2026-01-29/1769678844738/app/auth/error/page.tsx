/**
 * Auth Error Page
 *
 * Displays authentication errors
 */

import Link from 'next/link'

export const metadata = {
  title: 'Error | Retro Analytics Dashboard',
  description: 'Authentication error',
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const error = searchParams.error || 'unknown'

  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The verification token has expired or has already been used.',
    Default: 'An error occurred during authentication.',
  }

  const message = errorMessages[error] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-500 mb-2 font-mono uppercase">
            RETRO ANALYTICS
          </h1>
          <p className="text-green-400 font-mono">AUTHENTICATION ERROR</p>
        </div>
        <div className="border-2 border-green-500 p-8 bg-black shadow-[0_0_20px_rgba(0,255,0,0.3)]">
          <p className="text-red-500 font-mono text-center mb-6">{message}</p>
          <div className="flex justify-center">
            <Link
              href="/auth/login"
              className="border-2 border-green-500 bg-black text-green-500 px-6 py-2 font-mono uppercase hover:bg-green-500 hover:text-black transition-colors"
            >
              BACK TO LOGIN
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
