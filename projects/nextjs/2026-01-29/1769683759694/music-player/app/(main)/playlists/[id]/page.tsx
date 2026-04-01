import { TrackList } from '@/components/music/track-list'
import Image from 'next/image'
import { Play, Heart, MoreHorizontal, Lock, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchPlaylist } from '@/lib/api-client'

interface PlaylistPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const { id } = await params

  // Fetch playlist data from API
  const playlist = await fetchPlaylist(id)
  const tracks = playlist?.tracks?.map(pt => pt.track) || []

  if (!playlist) {
    return (
      <div className="container mx-auto px-6 py-8">
        <p className="text-muted-foreground">Playlist not found</p>
      </div>
    )
  }

  const totalDurationSeconds = tracks.reduce((sum, track) => sum + track.duration, 0)
  const totalDuration = Math.floor(totalDurationSeconds / 60)

  return (
    <div>
        {/* Playlist Header */}
        <div className="relative h-96 bg-gradient-to-b from-green-600 to-background">
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-6 pb-8">
              <div className="flex items-end gap-6">
                {/* Playlist Cover */}
                <div className="relative w-56 h-56 rounded-lg overflow-hidden shadow-2xl flex-shrink-0">
                  {playlist.coverImageUrl ? (
                    <Image
                      src={playlist.coverImageUrl}
                      alt={playlist.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-6xl">🎵</span>
                    </div>
                  )}
                </div>

                {/* Playlist Info */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    {playlist.isPublic ? (
                      <>
                        <Globe className="h-4 w-4" />
                        <span className="font-semibold">Public Playlist</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span className="font-semibold">Private Playlist</span>
                      </>
                    )}
                  </div>
                  <h1 className="text-5xl font-bold mb-4">
                    {playlist.name}
                  </h1>
                  <p className="text-sm text-muted-foreground mb-2">
                    {playlist.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">
                      {playlist.user?.name || 'Unknown User'}
                    </span>
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
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                This playlist is empty
              </p>
              <Button>Find Songs</Button>
            </div>
          ) : (
            <TrackList tracks={tracks} />
          )}
        </div>
      </div>
  )
}
