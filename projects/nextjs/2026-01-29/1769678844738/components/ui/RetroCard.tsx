import React from 'react'

interface RetroCardProps {
  children: React.ReactNode
  className?: string
  title?: string
  glow?: boolean
}

export function RetroCard({ children, className = '', title, glow = true }: RetroCardProps) {
  const glowClass = glow ? 'shadow-[0_0_20px_rgba(0,255,0,0.3)]' : ''

  return (
    <div className={`border-2 border-green-500 bg-black p-6 ${glowClass} ${className}`}>
      {title && (
        <h3 className="text-xl font-bold text-green-500 mb-4 font-mono uppercase retro-glow">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
