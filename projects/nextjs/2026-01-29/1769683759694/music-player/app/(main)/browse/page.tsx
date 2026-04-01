import { ArtistGrid } from '@/components/music/artist-grid'
import { AlbumGrid } from '@/components/music/album-grid'
import { fetchArtists, fetchAlbums } from '@/lib/api-client'

export default async function BrowsePage() {
  // Fetch data from API
  const artists = await fetchArtists({ limit: 20 })
  const albums = await fetchAlbums({ limit: 20 })
  const genres = [
    'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical',
    'Country', 'R&B', 'Indie', 'Metal', 'Folk', 'Blues'
  ]

  return (
    <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Browse</h1>

        {/* Genres Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Browse by Genre</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {genres.map((genre) => (
              <div
                key={genre}
                className="aspect-square rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              >
                <span className="text-white text-xl font-bold">{genre}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Artists Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Popular Artists</h2>
          {artists.length === 0 ? (
            <p className="text-muted-foreground">
              No artists available at the moment.
            </p>
          ) : (
            <ArtistGrid artists={artists} />
          )}
        </section>

        {/* New Releases Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">New Releases</h2>
          {albums.length === 0 ? (
            <p className="text-muted-foreground">
              No new releases available at the moment.
            </p>
          ) : (
            <AlbumGrid albums={albums} />
          )}
        </section>
      </div>
  )
}
