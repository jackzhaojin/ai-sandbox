import React from 'react'

interface LoadingSpinnerProps {
  message?: string
  className?: string
}

export function LoadingSpinner({ message = 'LOADING', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="text-green-500 font-mono text-2xl mb-4 retro-glow">
        {message}<span className="blink">_</span>
      </div>
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-green-500 animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="w-3 h-3 bg-green-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="w-3 h-3 bg-green-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}
