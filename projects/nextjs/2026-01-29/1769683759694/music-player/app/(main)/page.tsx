import { AlbumGrid } from '@/components/music/album-grid'
import { TrackList } from '@/components/music/track-list'
import { fetchAlbums, fetchPlayHistory } from '@/lib/api-client'

export default async function HomePage() {
  // Fetch featured content from API
  const featuredAlbums = await fetchAlbums({ limit: 10 })
  const playHistory = await fetchPlayHistory({ limit: 20, completedOnly: true })

  // Extract unique tracks from play history for recently played
  const recentlyPlayed = playHistory
    .map(h => h.track)
    .filter((track, index, self) =>
      index === self.findIndex(t => t.id === track.id)
    )
    .slice(0, 10)

  return (
    <>
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Welcome Back</h1>

        {/* Featured Albums Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Featured Albums</h2>
          {featuredAlbums.length === 0 ? (
            <p className="text-muted-foreground">
              No featured albums available at the moment.
            </p>
          ) : (
            <AlbumGrid albums={featuredAlbums} />
          )}
        </section>

        {/* Recently Played Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Recently Played</h2>
          {recentlyPlayed.length === 0 ? (
            <p className="text-muted-foreground">
              Start listening to see your recently played tracks here.
            </p>
          ) : (
            <TrackList tracks={recentlyPlayed} />
          )}
        </section>
      </div>
    </>
  )
}
