import { TrackList } from '@/components/music/track-list'
import { fetchFavorites } from '@/lib/api-client'

export default async function FavoritesPage() {
  // Fetch user's favorite tracks from API
  const favorites = await fetchFavorites({ limit: 100 })
  const favoriteTracks = favorites.map(f => f.track)

  return (
    <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Favorite Songs</h1>
          <p className="text-muted-foreground">
            {favoriteTracks.length} {favoriteTracks.length === 1 ? 'song' : 'songs'}
          </p>
        </div>

        {favoriteTracks.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <span className="text-4xl">♥</span>
            </div>
            <h2 className="text-2xl font-semibold mb-2">
              No favorite songs yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Songs you like will appear here
            </p>
            <button className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90">
              Browse Music
            </button>
          </div>
        ) : (
          <TrackList tracks={favoriteTracks} />
        )}
      </div>
  )
}
