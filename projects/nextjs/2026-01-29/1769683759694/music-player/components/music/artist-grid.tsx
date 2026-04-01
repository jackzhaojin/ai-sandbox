'use client'

import { ArtistCard } from './artist-card'
import type { ArtistWithAlbums } from '@/lib/types'

interface ArtistGridProps {
  artists: ArtistWithAlbums[]
}

export function ArtistGrid({ artists }: ArtistGridProps) {
  if (artists.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No artists found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {artists.map((artist) => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  )
}
