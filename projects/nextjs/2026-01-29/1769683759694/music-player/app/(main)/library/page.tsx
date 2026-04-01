import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlaylistGrid } from '@/components/music/playlist-grid'
import { AlbumGrid } from '@/components/music/album-grid'
import { ArtistGrid } from '@/components/music/artist-grid'
import { fetchPlaylists, fetchAlbums, fetchArtists } from '@/lib/api-client'

export default async function LibraryPage() {
  // Fetch user's library data from API
  const playlists = await fetchPlaylists({ limit: 50 })
  const albums = await fetchAlbums({ limit: 50 })
  const artists = await fetchArtists({ limit: 50 })

  return (
    <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Library</h1>

        <Tabs defaultValue="playlists" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="albums">Albums</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
          </TabsList>

          <TabsContent value="playlists">
            {playlists.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  You haven't created any playlists yet.
                </p>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  Create Your First Playlist
                </button>
              </div>
            ) : (
              <PlaylistGrid playlists={playlists} />
            )}
          </TabsContent>

          <TabsContent value="albums">
            {albums.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  You haven't saved any albums yet.
                </p>
              </div>
            ) : (
              <AlbumGrid albums={albums} />
            )}
          </TabsContent>

          <TabsContent value="artists">
            {artists.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  You haven't followed any artists yet.
                </p>
              </div>
            ) : (
              <ArtistGrid artists={artists} />
            )}
          </TabsContent>
        </Tabs>
      </div>
  )
}
