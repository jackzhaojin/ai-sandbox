'use client'

import { TrackItem } from './track-item'
import type { TrackWithRelations } from '@/lib/types'

interface TrackListProps {
  tracks: TrackWithRelations[]
  currentTrackId?: string
  favoritedTrackIds?: Set<string>
  showAlbum?: boolean
  onPlay?: (track: TrackWithRelations) => void
  onToggleFavorite?: (trackId: string) => void
}

export function TrackList({
  tracks,
  currentTrackId,
  favoritedTrackIds = new Set(),
  showAlbum = true,
  onPlay,
  onToggleFavorite,
}: TrackListProps) {
  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tracks found</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {tracks.map((track, index) => (
        <TrackItem
          key={track.id}
          track={track}
          index={index}
          isPlaying={track.id === currentTrackId}
          isFavorited={favoritedTrackIds.has(track.id)}
          showAlbum={showAlbum}
          onPlay={onPlay}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  )
}
