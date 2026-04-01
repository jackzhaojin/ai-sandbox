/**
 * TypeScript types for Music Player Platform
 * Based on Prisma schema models
 */

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithRelations extends User {
  playlists?: Playlist[];
  favorites?: Favorite[];
}

// ============================================================================
// Music Entity Types
// ============================================================================

export interface Artist {
  id: string;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArtistWithAlbums extends Artist {
  albums: AlbumWithRelations[];
  tracks?: TrackWithRelations[];
  _count?: {
    albums: number;
    tracks: number;
  };
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  coverArtUrl: string | null;
  releaseDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlbumWithRelations extends Album {
  artist: Artist;
  tracks: TrackWithRelations[];
  _count?: {
    tracks: number;
  };
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  albumId: string | null;
  duration: number; // Duration in seconds
  audioUrl: string;
  trackNumber: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackWithRelations extends Track {
  artist: Artist;
  album: Album | null;
  isFavorited?: boolean;
}

// ============================================================================
// Playlist Types
// ============================================================================

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistWithTracks extends Playlist {
  tracks: PlaylistTrackWithDetails[];
  user?: User;
  _count?: {
    tracks: number;
  };
}

export interface PlaylistTrack {
  id: string;
  playlistId: string;
  trackId: string;
  position: number;
  addedAt: string;
}

export interface PlaylistTrackWithDetails extends PlaylistTrack {
  track: TrackWithRelations;
}

// ============================================================================
// User Interaction Types
// ============================================================================

export interface Favorite {
  id: string;
  userId: string;
  trackId: string;
  createdAt: string;
}

export interface FavoriteWithTrack extends Favorite {
  track: TrackWithRelations;
}

export interface PlayHistory {
  id: string;
  userId: string;
  trackId: string;
  playedAt: string;
  completed: boolean;
}

export interface PlayHistoryWithTrack extends PlayHistory {
  track: TrackWithRelations;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface PlayerState {
  currentTrack: TrackWithRelations | null;
  isPlaying: boolean;
  volume: number; // 0-100
  currentTime: number; // Current playback position in seconds
  duration: number; // Track duration in seconds
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: 'off' | 'all' | 'one';
}

export interface QueueState {
  tracks: TrackWithRelations[];
  currentIndex: number;
  originalQueue: TrackWithRelations[];
}

// ============================================================================
// Form Types
// ============================================================================

export interface CreatePlaylistInput {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdatePlaylistInput {
  name?: string;
  description?: string;
  isPublic?: boolean;
  coverImageUrl?: string;
}

export interface AddTracksToPlaylistInput {
  trackIds: string[];
}

// ============================================================================
// Utility Types
// ============================================================================

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format duration in seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return formatDate(dateString);
}
