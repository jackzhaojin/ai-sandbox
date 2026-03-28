'use client'

import React from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function MetricCard({ title, value, subtitle, trend, className = '' }: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return '▲'
    if (trend === 'down') return '▼'
    return '●'
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-400'
    if (trend === 'down') return 'text-red-400'
    return 'text-cyan-400'
  }

  return (
    <div className={`border-2 border-green-500 bg-black p-6 shadow-[0_0_20px_rgba(0,255,0,0.3)] ${className}`}>
      <div className="font-mono">
        <div className="text-green-600 text-xs uppercase mb-2">{title}</div>
        <div className="text-4xl font-bold text-green-400 mb-2 retro-glow">
          {value}
        </div>
        {subtitle && (
          <div className={`text-sm flex items-center gap-2 ${getTrendColor()}`}>
            <span>{getTrendIcon()}</span>
            <span>{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  )
}
