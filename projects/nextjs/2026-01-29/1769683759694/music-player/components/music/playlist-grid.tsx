import type { PlaylistWithTracks } from '@/lib/types'
import { PlaylistCard } from './playlist-card'

interface PlaylistGridProps {
  playlists: PlaylistWithTracks[]
}

export function PlaylistGrid({ playlists }: PlaylistGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {playlists.map((playlist) => (
        <PlaylistCard key={playlist.id} playlist={playlist} />
      ))}
    </div>
  )
}
