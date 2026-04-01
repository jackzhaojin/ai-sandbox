'use client'

import { Slider } from '@/components/ui/slider'
import { formatDuration } from '@/lib/types'

interface ProgressBarProps {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

export function ProgressBar({ currentTime, duration, onSeek }: ProgressBarProps) {
  const handleSeek = (value: number) => {
    onSeek(value)
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-xs text-muted-foreground w-10 text-right">
        {formatDuration(currentTime)}
      </span>
      <Slider
        value={currentTime}
        min={0}
        max={duration || 100}
        step={1}
        onChange={handleSeek}
        className="flex-1"
      />
      <span className="text-xs text-muted-foreground w-10">
        {formatDuration(duration)}
      </span>
    </div>
  )
}
