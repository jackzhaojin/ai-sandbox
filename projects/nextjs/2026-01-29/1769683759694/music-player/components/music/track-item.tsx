'use client'

import Image from 'next/image'
import { Play, Heart, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDuration, type TrackWithRelations } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TrackItemProps {
  track: TrackWithRelations
  index?: number
  isPlaying?: boolean
  isFavorited?: boolean
  showAlbum?: boolean
  onPlay?: (track: TrackWithRelations) => void
  onToggleFavorite?: (trackId: string) => void
}

export function TrackItem({
  track,
  index,
  isPlaying = false,
  isFavorited = false,
  showAlbum = true,
  onPlay,
  onToggleFavorite,
}: TrackItemProps) {
  const handlePlay = () => {
    onPlay?.(track)
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite?.(track.id)
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors",
        isPlaying && "bg-accent"
      )}
      onClick={handlePlay}
    >
      {/* Track number or play button */}
      <div className="w-8 text-center">
        <span className="group-hover:hidden text-sm text-muted-foreground">
          {index !== undefined ? index + 1 : track.trackNumber || '-'}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="hidden group-hover:inline-flex h-8 w-8"
          onClick={handlePlay}
        >
          <Play className="h-4 w-4" />
        </Button>
      </div>

      {/* Track info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {track.album?.coverArtUrl && (
          <Image
            src={track.album.coverArtUrl}
            alt={track.title}
            width={40}
            height={40}
            className="rounded"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className={cn(
            "font-medium truncate",
            isPlaying && "text-green-500"
          )}>
            {track.title}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {track.artist.name}
          </p>
        </div>
      </div>

      {/* Album name (optional) */}
      {showAlbum && track.album && (
        <div className="hidden md:block flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">
            {track.album.title}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleToggleFavorite}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              isFavorited && "fill-red-500 text-red-500"
            )}
          />
        </Button>
        <span className="text-sm text-muted-foreground w-12 text-right">
          {formatDuration(track.duration)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
