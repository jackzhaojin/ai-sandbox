import { TrackList } from '@/components/music/track-list'
import Image from 'next/image'
import { Play, Heart, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate, formatDuration } from '@/lib/types'
import { fetchAlbum } from '@/lib/api-client'

interface AlbumPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params

  // Fetch album data from API
  const album = await fetchAlbum(id)
  const tracks = album?.tracks || []

  if (!album) {
    return (
      <div className="container mx-auto px-6 py-8">
        <p className="text-muted-foreground">Album not found</p>
      </div>
    )
  }

  // Calculate total duration
  const totalDurationSeconds = tracks.reduce((sum, track) => sum + track.duration, 0)
  const totalDuration = Math.floor(totalDurationSeconds / 60)

  return (
    <div>
        {/* Album Header */}
        <div className="relative h-96 bg-gradient-to-b from-blue-600 to-background">
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-6 pb-8">
              <div className="flex items-end gap-6">
                {/* Album Cover */}
                <div className="relative w-56 h-56 rounded-lg overflow-hidden shadow-2xl flex-shrink-0">
                  {album.coverArtUrl ? (
                    <Image
                      src={album.coverArtUrl}
                      alt={album.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-6xl">♪</span>
                    </div>
                  )}
                </div>

                {/* Album Info */}
                <div className="flex-1 pb-2">
                  <p className="text-sm font-semibold mb-2">ALBUM</p>
                  <h1 className="text-5xl font-bold mb-4">
                    {album.title}
                  </h1>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">
                      {album.artist.name}
                    </span>
                    <span>•</span>
                    <span>{album.releaseDate ? new Date(album.releaseDate).getFullYear() : 'Unknown'}</span>
                    <span>•</span>
                    <span>{tracks.length} songs</span>
                    <span>•</span>
                    <span>{totalDuration} min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button size="lg" className="h-14 w-14 rounded-full">
              <Play className="h-6 w-6 ml-0.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Track List */}
        <div className="container mx-auto px-6 pb-8">
          {tracks.length === 0 ? (
            <p className="text-muted-foreground">No tracks available</p>
          ) : (
            <TrackList tracks={tracks} />
          )}

          {/* Album Details */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Released: {album.releaseDate ? formatDate(album.releaseDate) : 'Unknown'}
            </p>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Record Label
            </p>
          </div>
        </div>
      </div>
  )
}
