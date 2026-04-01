'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { PlayerControls } from './player-controls'
import { ProgressBar } from './progress-bar'
import { VolumeControl } from './volume-control'
import { Button } from '@/components/ui/button'
import type { PlayerState } from '@/lib/types'

export function PlayerBar() {
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentTrack: null,
    isPlaying: false,
    volume: 70,
    currentTime: 0,
    duration: 0,
    isMuted: false,
    isShuffled: false,
    repeatMode: 'off',
  })

  const [isFavorited, setIsFavorited] = useState(false)

  const handlePlayPause = () => {
    setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
  }

  const handlePrevious = () => {
    // TODO: Implement previous track logic
    console.log('Previous track')
  }

  const handleNext = () => {
    // TODO: Implement next track logic
    console.log('Next track')
  }

  const handleShuffle = () => {
    setPlayerState(prev => ({ ...prev, isShuffled: !prev.isShuffled }))
  }

  const handleRepeat = () => {
    setPlayerState(prev => ({
      ...prev,
      repeatMode: prev.repeatMode === 'off' ? 'all' : prev.repeatMode === 'all' ? 'one' : 'off',
    }))
  }

  const handleSeek = (time: number) => {
    setPlayerState(prev => ({ ...prev, currentTime: time }))
  }

  const handleVolumeChange = (volume: number) => {
    setPlayerState(prev => ({ ...prev, volume, isMuted: false }))
  }

  const handleMuteToggle = () => {
    setPlayerState(prev => ({ ...prev, isMuted: !prev.isMuted }))
  }

  const handleToggleFavorite = () => {
    setIsFavorited(prev => !prev)
    // TODO: Call API to add/remove from favorites
  }

  if (!playerState.currentTrack) {
    return (
      <footer className="border-t bg-muted/20 p-4">
        <div className="flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Select a track to start playing
          </p>
        </div>
      </footer>
    )
  }

  const { currentTrack } = playerState

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4">
        {/* Progress bar */}
        <div className="py-2">
          <ProgressBar
            currentTime={playerState.currentTime}
            duration={playerState.duration}
            onSeek={handleSeek}
          />
        </div>

        {/* Main player controls */}
        <div className="flex items-center justify-between pb-4">
          {/* Currently playing track info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {currentTrack.album?.coverArtUrl && (
              <Image
                src={currentTrack.album.coverArtUrl}
                alt={currentTrack.title}
                width={56}
                height={56}
                className="rounded-md"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{currentTrack.title}</p>
              <p className="text-sm text-muted-foreground truncate">
                {currentTrack.artist.name}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
              className="h-8 w-8 flex-shrink-0"
            >
              <Heart
                className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`}
              />
            </Button>
          </div>

          {/* Player controls */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <PlayerControls
              playerState={playerState}
              onPlayPause={handlePlayPause}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onShuffle={handleShuffle}
              onRepeat={handleRepeat}
            />
          </div>

          {/* Volume control */}
          <div className="flex-1 flex justify-end">
            <VolumeControl
              volume={playerState.volume}
              isMuted={playerState.isMuted}
              onVolumeChange={handleVolumeChange}
              onMuteToggle={handleMuteToggle}
            />
          </div>
        </div>
      </div>
    </footer>
  )
}
