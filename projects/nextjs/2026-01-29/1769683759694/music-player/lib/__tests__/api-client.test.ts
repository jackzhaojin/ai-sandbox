/**
 * Unit tests for API client functions
 */

import {
  fetchTracks,
  fetchTrack,
  fetchAlbums,
  fetchAlbum,
  fetchArtists,
  fetchArtist,
  fetchPlaylists,
  fetchPlaylist,
  fetchFavorites,
  fetchPlayHistory,
  addToFavorites,
  removeFromFavorites,
  recordPlay,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
} from '../api-client';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('fetchTracks', () => {
    it('should fetch tracks successfully', async () => {
      const mockTracks = [
        { id: '1', title: 'Track 1' },
        { id: '2', title: 'Track 2' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTracks,
      });

      const result = await fetchTracks();
      expect(result).toEqual(mockTracks);
      expect(global.fetch).toHaveBeenCalledWith('/api/tracks', { cache: 'no-store' });
    });

    it('should handle fetch errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Error message',
      });

      const result = await fetchTracks();
      expect(result).toEqual([]);
    });

    it('should build query params correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchTracks({ limit: 10, offset: 20, search: 'test' });
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tracks?limit=10&offset=20&search=test',
        { cache: 'no-store' }
      );
    });
  });

  describe('fetchTrack', () => {
    it('should fetch a single track', async () => {
      const mockTrack = { id: '1', title: 'Track 1' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrack,
      });

      const result = await fetchTrack('1');
      expect(result).toEqual(mockTrack);
      expect(global.fetch).toHaveBeenCalledWith('/api/tracks/1', { cache: 'no-store' });
    });

    it('should return null on error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Not found',
      });

      const result = await fetchTrack('999');
      expect(result).toBeNull();
    });
  });

  describe('addToFavorites', () => {
    it('should add track to favorites', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await addToFavorites('track-123');
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: 'track-123' }),
      });
    });

    it('should handle errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const result = await addToFavorites('track-123');
      expect(result).toBe(false);
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await addToFavorites('track-123');
      expect(result).toBe(false);
    });
  });

  describe('removeFromFavorites', () => {
    it('should remove track from favorites', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await removeFromFavorites('track-123');
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: 'track-123' }),
      });
    });
  });

  describe('recordPlay', () => {
    it('should record a play', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await recordPlay('track-123', true);
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/playhistory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: 'track-123', completed: true }),
      });
    });

    it('should default completed to false', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      await recordPlay('track-123');
      expect(global.fetch).toHaveBeenCalledWith('/api/playhistory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: 'track-123', completed: false }),
      });
    });
  });

  describe('createPlaylist', () => {
    it('should create a playlist', async () => {
      const mockPlaylist = { id: '1', name: 'My Playlist' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlaylist,
      });

      const result = await createPlaylist({
        name: 'My Playlist',
        description: 'Test playlist',
        isPublic: true,
      });

      expect(result).toEqual(mockPlaylist);
      expect(global.fetch).toHaveBeenCalledWith('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'My Playlist',
          description: 'Test playlist',
          isPublic: true,
        }),
      });
    });

    it('should return null on error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const result = await createPlaylist({ name: 'My Playlist' });
      expect(result).toBeNull();
    });
  });

  describe('updatePlaylist', () => {
    it('should update a playlist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await updatePlaylist('playlist-1', {
        name: 'Updated Name',
        isPublic: false,
      });

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/playlists/playlist-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Name',
          isPublic: false,
        }),
      });
    });
  });

  describe('deletePlaylist', () => {
    it('should delete a playlist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await deletePlaylist('playlist-1');
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/playlists/playlist-1', {
        method: 'DELETE',
      });
    });
  });

  describe('addTrackToPlaylist', () => {
    it('should add track to playlist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await addTrackToPlaylist('playlist-1', 'track-123', 5);
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/playlists/playlist-1/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: 'track-123',
          position: 5,
        }),
      });
    });

    it('should work without position', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      await addTrackToPlaylist('playlist-1', 'track-123');
      expect(global.fetch).toHaveBeenCalledWith('/api/playlists/playlist-1/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: 'track-123',
          position: undefined,
        }),
      });
    });
  });

  describe('removeTrackFromPlaylist', () => {
    it('should remove track from playlist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await removeTrackFromPlaylist('playlist-1', 'track-123');
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/playlists/playlist-1/tracks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: 'track-123',
        }),
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response arrays', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await fetchTracks();
      expect(result).toEqual([]);
    });

    it('should handle malformed JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(fetchTracks()).rejects.toThrow('Invalid JSON');
    });
  });
});
