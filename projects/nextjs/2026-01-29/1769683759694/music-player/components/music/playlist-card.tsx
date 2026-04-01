import Link from 'next/link'
import Image from 'next/image'
import type { PlaylistWithTracks } from '@/lib/types'

interface PlaylistCardProps {
  playlist: PlaylistWithTracks
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const trackCount = playlist._count?.tracks || playlist.tracks?.length || 0

  return (
    <Link
      href={`/playlists/${playlist.id}`}
      className="group block p-4 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="aspect-square relative mb-4 rounded-md overflow-hidden bg-muted">
        {playlist.coverImageUrl ? (
          <Image
            src={playlist.coverImageUrl}
            alt={playlist.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <span className="text-white text-4xl">♪</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="font-semibold truncate mb-1">{playlist.name}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {trackCount} {trackCount === 1 ? 'song' : 'songs'}
        </p>
      </div>
    </Link>
  )
}
