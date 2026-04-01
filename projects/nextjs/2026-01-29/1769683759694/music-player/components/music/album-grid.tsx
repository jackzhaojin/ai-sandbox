'use client'

import { AlbumCard } from './album-card'
import type { AlbumWithRelations } from '@/lib/types'

interface AlbumGridProps {
  albums: AlbumWithRelations[]
  onPlay?: (albumId: string) => void
}

export function AlbumGrid({ albums, onPlay }: AlbumGridProps) {
  if (albums.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No albums found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} onPlay={onPlay} />
      ))}
    </div>
  )
}
