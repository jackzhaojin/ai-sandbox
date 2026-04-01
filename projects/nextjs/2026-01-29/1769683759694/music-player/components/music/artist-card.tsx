'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import type { ArtistWithAlbums } from '@/lib/types'

interface ArtistCardProps {
  artist: ArtistWithAlbums
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const albumCount = artist._count?.albums || artist.albums?.length || 0

  return (
    <Link href={`/artists/${artist.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer">
        <div className="relative aspect-square">
          {artist.imageUrl ? (
            <Image
              src={artist.imageUrl}
              alt={artist.name}
              fill
              className="object-cover rounded-full m-4"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-6xl text-muted-foreground">🎤</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold truncate mb-1 text-center">{artist.name}</h3>
          <p className="text-sm text-muted-foreground text-center">
            {albumCount} {albumCount === 1 ? 'album' : 'albums'}
          </p>
        </div>
      </Card>
    </Link>
  )
}
