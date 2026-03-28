import React from 'react'

export interface SpacerProps {
  height?: 'small' | 'medium' | 'large' | 'xl'
}

export default function Spacer({
  height = 'medium'
}: SpacerProps) {
  // Height variants using margin
  const heightClasses = {
    small: 'h-8 sm:h-12',
    medium: 'h-16 sm:h-20',
    large: 'h-24 sm:h-32',
    xl: 'h-32 sm:h-40 lg:h-48'
  }

  return (
    <div
      className={`w-full ${heightClasses[height]}`}
      role="separator"
      aria-hidden="true"
    />
  )
}
