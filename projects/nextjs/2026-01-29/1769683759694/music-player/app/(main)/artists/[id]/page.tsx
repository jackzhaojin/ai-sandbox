import { AlbumGrid } from '@/components/music/album-grid'
import { TrackList } from '@/components/music/track-list'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchArtist } from '@/lib/api-client'

interface ArtistPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { id } = await params

  // Fetch artist data from API
  const artist = await fetchArtist(id)
  const albums = artist?.albums || []
  const popularTracks = artist?.tracks || []

  if (!artist) {
    return (
      <div className="container mx-auto px-6 py-8">
        <p className="text-muted-foreground">Artist not found</p>
      </div>
    )
  }

  return (
    <div>
        {/* Artist Header */}
        <div className="relative h-96 bg-gradient-to-b from-purple-600 to-background">
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-6 pb-8">
              <div className="flex items-end gap-6">
                {/* Artist Image */}
                <div className="relative w-48 h-48 rounded-full overflow-hidden shadow-2xl flex-shrink-0">
                  {artist.imageUrl ? (
                    <Image
                      src={artist.imageUrl}
                      alt={artist.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-6xl">🎤</span>
                    </div>
                  )}
                </div>

                {/* Artist Info */}
                <div className="flex-1 pb-2">
                  <p className="text-sm font-semibold mb-2">ARTIST</p>
                  <h1 className="text-6xl font-bold mb-4">
                    {artist.name}
                  </h1>
                  <p className="text-lg">
                    {artist._count?.albums || 0} albums • {artist._count?.tracks || 0} songs
                  </p>
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
            <Button variant="outline" size="lg">
              Follow
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 pb-8">
          {/* Popular Tracks */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Popular</h2>
            {popularTracks.length === 0 ? (
              <p className="text-muted-foreground">No tracks available</p>
            ) : (
              <TrackList tracks={popularTracks} />
            )}
          </section>

          {/* Albums */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Albums</h2>
            {albums.length === 0 ? (
              <p className="text-muted-foreground">No albums available</p>
            ) : (
              <AlbumGrid albums={albums} />
            )}
          </section>

          {/* About */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">About</h2>
            <p className="text-muted-foreground">
              {artist.bio || 'No bio available'}
            </p>
          </section>
        </div>
      </div>
  )
}
