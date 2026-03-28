'use client'

import { useEffect } from 'react'
import { RetroCard } from '@/components/ui/RetroCard'
import { RetroButton } from '@/components/ui/RetroButton'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <RetroCard title="ERROR DETECTED" glow>
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-red-500 font-mono text-xl retro-glow">
              SYSTEM ERROR
            </p>
            <p className="text-green-400 font-mono text-sm">
              An unexpected error has occurred.
            </p>
          </div>

          <div className="bg-black border-2 border-red-500 p-4 rounded font-mono text-sm">
            <p className="text-red-400 whitespace-pre-wrap break-all">
              {error.message || 'Unknown error'}
            </p>
            {error.digest && (
              <p className="text-red-600 text-xs mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <RetroButton onClick={reset} variant="primary">
              TRY AGAIN
            </RetroButton>
            <RetroButton onClick={() => (window.location.href = '/dashboard')}>
              GO HOME
            </RetroButton>
          </div>

          <div className="text-green-600 font-mono text-xs">
            <p>* If this error persists, please contact support</p>
            <p>* Error logged at: {new Date().toISOString()}</p>
          </div>
        </div>
      </RetroCard>
    </div>
  )
}
