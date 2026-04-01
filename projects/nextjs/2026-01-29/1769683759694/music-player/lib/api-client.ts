/**
 * API Client for Music Player Platform
 * Server-side and client-side data fetching utilities
 */

import type {
  TrackWithRelations,
  AlbumWithRelations,
  ArtistWithAlbums,
  PlaylistWithTracks,
  FavoriteWithTrack,
  PlayHistoryWithTrack,
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

// ============================================================================
// Server-side API Client (for use in Server Components)
// ============================================================================

/**
 * Fetch tracks from the API
 */
export async function fetchTracks(params?: {
  limit?: number
  offset?: number
  artist?: string
  album?: string
  search?: string
}): Promise<TrackWithRelations[]> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())
  if (params?.artist) searchParams.set('artist', params.artist)
  if (params?.album) searchParams.set('album', params.album)
  if (params?.search) searchParams.set('search', params.search)

  const url = `${API_BASE_URL}/api/tracks${searchParams.toString() ? `?${searchParams}` : ''}`
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    console.error('Failed to fetch tracks:', await res.text())
    return []
  }

  return res.json()
}

/**
 * Fetch single track by ID
 */
export async function fetchTrack(id: string): Promise<TrackWithRelations | null> {
  const res = await fetch(`${API_BASE_URL}/api/tracks/${id}`, { cache: 'no-store' })

  if (!res.ok) {
    console.error('Failed to fetch track:', await res.text())
    return null
  }

  return res.json()
}

/**
 * Fetch albums from the API
 */
export async function fetchAlbums(params?: {
  limit?: number
  offset?: number
  artist?: string
  search?: string
}): Promise<AlbumWithRelations[]> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())
  if (params?.artist) searchParams.set('artist', params.artist)
  if (params?.search) searchParams.set('search', params.search)

  const url = `${API_BASE_URL}/api/albums${searchParams.toString() ? `?${searchParams}` : ''}`
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    console.error('Failed to fetch albums:', await res.text())
    return []
  }

  return res.json()
}

/**
 * Fetch single album by ID with tracks
 */
export async function fetchAlbum(id: string): Promise<AlbumWithRelations | null> {
  const res = await fetch(`${API_BASE_URL}/api/albums/${id}`, { cache: 'no-store' })

  if (!res.ok) {
    console.error('Failed to fetch album:', await res.text())
    return null
  }

  return res.json()
}

/**
 * Fetch artists from the API
 */
export async function fetchArtists(params?: {
  limit?: number
  offset?: number
  search?: string
}): Promise<ArtistWithAlbums[]> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())
  if (params?.search) searchParams.set('search', params.search)

  const url = `${API_BASE_URL}/api/artists${searchParams.toString() ? `?${searchParams}` : ''}`
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    console.error('Failed to fetch artists:', await res.text())
    return []
  }

  return res.json()
}

/**
 * Fetch single artist by ID with albums
 */
export async function fetchArtist(id: string): Promise<ArtistWithAlbums | null> {
  const res = await fetch(`${API_BASE_URL}/api/artists/${id}`, { cache: 'no-store' })

  if (!res.ok) {
    console.error('Failed to fetch artist:', await res.text())
    return null
  }

  return res.json()
}

/**
 * Fetch user's playlists
 */
export async function fetchPlaylists(params?: {
  limit?: number
  offset?: number
  includePublic?: boolean
}): Promise<PlaylistWithTracks[]> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())
  if (params?.includePublic) searchParams.set('includePublic', 'true')

  const url = `${API_BASE_URL}/api/playlists${searchParams.toString() ? `?${searchParams}` : ''}`
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    console.error('Failed to fetch playlists:', await res.text())
    return []
  }

  return res.json()
}

/**
 * Fetch single playlist by ID with tracks
 */
export async function fetchPlaylist(id: string): Promise<PlaylistWithTracks | null> {
  const res = await fetch(`${API_BASE_URL}/api/playlists/${id}`, { cache: 'no-store' })

  if (!res.ok) {
    console.error('Failed to fetch playlist:', await res.text())
    return null
  }

  return res.json()
}

/**
 * Fetch user's favorite tracks
 */
export async function fetchFavorites(params?: {
  limit?: number
  offset?: number
}): Promise<FavoriteWithTrack[]> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())

  const url = `${API_BASE_URL}/api/favorites${searchParams.toString() ? `?${searchParams}` : ''}`
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    console.error('Failed to fetch favorites:', await res.text())
    return []
  }

  return res.json()
}

/**
 * Fetch user's play history
 */
export async function fetchPlayHistory(params?: {
  limit?: number
  offset?: number
  completedOnly?: boolean
}): Promise<PlayHistoryWithTrack[]> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())
  if (params?.completedOnly) searchParams.set('completedOnly', 'true')

  const url = `${API_BASE_URL}/api/playhistory${searchParams.toString() ? `?${searchParams}` : ''}`
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    console.error('Failed to fetch play history:', await res.text())
    return []
  }

  return res.json()
}

// ============================================================================
// Client-side API Client (for use in Client Components)
// ============================================================================

/**
 * Add track to favorites
 */
export async function addToFavorites(trackId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId }),
    })
    return res.ok
  } catch (error) {
    console.error('Failed to add to favorites:', error)
    return false
  }
}

/**
 * Remove track from favorites
 */
export async function removeFromFavorites(trackId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/favorites', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId }),
    })
    return res.ok
  } catch (error) {
    console.error('Failed to remove from favorites:', error)
    return false
  }
}

/**
 * Record a track play
 */
export async function recordPlay(trackId: string, completed: boolean = false): Promise<boolean> {
  try {
    const res = await fetch('/api/playhistory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId, completed }),
    })
    return res.ok
  } catch (error) {
    console.error('Failed to record play:', error)
    return false
  }
}

/**
 * Create a new playlist
 */
export async function createPlaylist(data: {
  name: string
  description?: string
  isPublic?: boolean
}): Promise<PlaylistWithTracks | null> {
  try {
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error('Failed to create playlist:', error)
    return null
  }
}

/**
 * Update a playlist
 */
export async function updatePlaylist(
  id: string,
  data: {
    name?: string
    description?: string
    isPublic?: boolean
    coverImageUrl?: string
  }
): Promise<boolean> {
  try {
    const res = await fetch(`/api/playlists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.ok
  } catch (error) {
    console.error('Failed to update playlist:', error)
    return false
  }
}

/**
 * Delete a playlist
 */
export async function deletePlaylist(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/playlists/${id}`, {
      method: 'DELETE',
    })
    return res.ok
  } catch (error) {
    console.error('Failed to delete playlist:', error)
    return false
  }
}

/**
 * Add track to playlist
 */
export async function addTrackToPlaylist(
  playlistId: string,
  trackId: string,
  position?: number
): Promise<boolean> {
  try {
    const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId, position }),
    })
    return res.ok
  } catch (error) {
    console.error('Failed to add track to playlist:', error)
    return false
  }
}

/**
 * Remove track from playlist
 */
export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId }),
    })
    return res.ok
  } catch (error) {
    console.error('Failed to remove track from playlist:', error)
    return false
  }
}
