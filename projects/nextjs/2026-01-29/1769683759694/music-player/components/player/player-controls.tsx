'use client'

import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PlayerState } from '@/lib/types'

interface PlayerControlsProps {
  playerState: PlayerState
  onPlayPause: () => void
  onPrevious: () => void
  onNext: () => void
  onShuffle: () => void
  onRepeat: () => void
}

export function PlayerControls({
  playerState,
  onPlayPause,
  onPrevious,
  onNext,
  onShuffle,
  onRepeat,
}: PlayerControlsProps) {
  const { isPlaying, isShuffled, repeatMode } = playerState

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Shuffle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onShuffle}
        className={cn(
          "h-8 w-8",
          isShuffled && "text-green-500"
        )}
        title="Shuffle"
      >
        <Shuffle className="h-4 w-4" />
      </Button>

      {/* Previous Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        disabled={!playerState.currentTrack}
        className="h-8 w-8"
        title="Previous"
      >
        <SkipBack className="h-5 w-5" />
      </Button>

      {/* Play/Pause Button */}
      <Button
        variant="default"
        size="icon"
        onClick={onPlayPause}
        disabled={!playerState.currentTrack}
        className="h-10 w-10 rounded-full"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" />
        )}
      </Button>

      {/* Next Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={!playerState.currentTrack}
        className="h-8 w-8"
        title="Next"
      >
        <SkipForward className="h-5 w-5" />
      </Button>

      {/* Repeat Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRepeat}
        className={cn(
          "h-8 w-8",
          repeatMode !== 'off' && "text-green-500"
        )}
        title={repeatMode === 'off' ? 'Repeat' : repeatMode === 'all' ? 'Repeat All' : 'Repeat One'}
      >
        {repeatMode === 'one' ? (
          <Repeat1 className="h-4 w-4" />
        ) : (
          <Repeat className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
