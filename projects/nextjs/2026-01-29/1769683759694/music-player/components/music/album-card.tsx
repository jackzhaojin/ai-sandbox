'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Play } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AlbumWithRelations } from '@/lib/types'
import { formatDate } from '@/lib/types'

interface AlbumCardProps {
  album: AlbumWithRelations
  onPlay?: (albumId: string) => void
}

export function AlbumCard({ album, onPlay }: AlbumCardProps) {
  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onPlay?.(album.id)
  }

  const trackCount = album._count?.tracks || album.tracks?.length || 0

  return (
    <Link href={`/albums/${album.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer">
        <div className="relative aspect-square">
          {album.coverArtUrl ? (
            <Image
              src={album.coverArtUrl}
              alt={album.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-4xl text-muted-foreground">♪</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <Button
              variant="default"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-12 w-12 rounded-full"
              onClick={handlePlay}
            >
              <Play className="h-6 w-6 ml-0.5" />
            </Button>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold truncate mb-1">{album.title}</h3>
          <p className="text-sm text-muted-foreground truncate mb-1">
            {album.artist.name}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{trackCount} {trackCount === 1 ? 'track' : 'tracks'}</span>
            {album.releaseDate && (
              <span>{new Date(album.releaseDate).getFullYear()}</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
