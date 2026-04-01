# Music Player API Documentation

This document describes all API endpoints for the Music Player application.

## Authentication

All API endpoints require authentication using NextAuth.js sessions. Unauthenticated requests will receive a `401 Unauthorized` response.

## Base URL

```
http://localhost:3000/api
```

## Response Format

All endpoints return JSON responses with appropriate HTTP status codes:
- `200 OK` - Successful GET request
- `201 Created` - Successful POST request that creates a resource
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate)
- `500 Internal Server Error` - Server error

---

## Tracks API

### List Tracks

Get a paginated list of tracks.

**Endpoint:** `GET /api/tracks`

**Query Parameters:**
- `limit` (optional) - Number of tracks to return (default: 50, max: 100)
- `offset` (optional) - Number of tracks to skip (default: 0)
- `artistId` (optional) - Filter by artist ID
- `albumId` (optional) - Filter by album ID
- `search` (optional) - Search by track title

**Response:**
```json
{
  "tracks": [
    {
      "id": "track_id",
      "title": "Track Title",
      "duration": 180,
      "audioUrl": "https://...",
      "trackNumber": 1,
      "artist": {
        "id": "artist_id",
        "name": "Artist Name",
        "imageUrl": "https://..."
      },
      "album": {
        "id": "album_id",
        "title": "Album Title",
        "coverArtUrl": "https://..."
      }
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Track by ID

Get detailed information about a single track.

**Endpoint:** `GET /api/tracks/[id]`

**Response:**
```json
{
  "id": "track_id",
  "title": "Track Title",
  "duration": 180,
  "audioUrl": "https://...",
  "trackNumber": 1,
  "isFavorite": false,
  "artist": {
    "id": "artist_id",
    "name": "Artist Name",
    "imageUrl": "https://...",
    "bio": "Artist bio..."
  },
  "album": {
    "id": "album_id",
    "title": "Album Title",
    "coverArtUrl": "https://...",
    "releaseDate": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Albums API

### List Albums

Get a paginated list of albums.

**Endpoint:** `GET /api/albums`

**Query Parameters:**
- `limit` (optional) - Number of albums to return (default: 50, max: 100)
- `offset` (optional) - Number of albums to skip (default: 0)
- `artistId` (optional) - Filter by artist ID
- `search` (optional) - Search by album title

**Response:**
```json
{
  "albums": [
    {
      "id": "album_id",
      "title": "Album Title",
      "coverArtUrl": "https://...",
      "releaseDate": "2024-01-01T00:00:00.000Z",
      "artist": {
        "id": "artist_id",
        "name": "Artist Name",
        "imageUrl": "https://..."
      },
      "_count": {
        "tracks": 12
      }
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### Get Album by ID

Get detailed album information with all tracks.

**Endpoint:** `GET /api/albums/[id]`

**Response:**
```json
{
  "id": "album_id",
  "title": "Album Title",
  "coverArtUrl": "https://...",
  "releaseDate": "2024-01-01T00:00:00.000Z",
  "totalDuration": 2400,
  "trackCount": 12,
  "artist": {
    "id": "artist_id",
    "name": "Artist Name",
    "imageUrl": "https://...",
    "bio": "Artist bio..."
  },
  "tracks": [
    {
      "id": "track_id",
      "title": "Track Title",
      "duration": 180,
      "trackNumber": 1,
      "artist": {
        "id": "artist_id",
        "name": "Artist Name"
      }
    }
  ]
}
```

---

## Artists API

### List Artists

Get a paginated list of artists.

**Endpoint:** `GET /api/artists`

**Query Parameters:**
- `limit` (optional) - Number of artists to return (default: 50, max: 100)
- `offset` (optional) - Number of artists to skip (default: 0)
- `search` (optional) - Search by artist name

**Response:**
```json
{
  "artists": [
    {
      "id": "artist_id",
      "name": "Artist Name",
      "imageUrl": "https://...",
      "bio": "Artist bio...",
      "_count": {
        "albums": 5,
        "tracks": 60
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### Get Artist by ID

Get detailed artist information with albums and recent tracks.

**Endpoint:** `GET /api/artists/[id]`

**Response:**
```json
{
  "id": "artist_id",
  "name": "Artist Name",
  "imageUrl": "https://...",
  "bio": "Artist bio...",
  "albums": [
    {
      "id": "album_id",
      "title": "Album Title",
      "coverArtUrl": "https://...",
      "releaseDate": "2024-01-01T00:00:00.000Z",
      "_count": {
        "tracks": 12
      }
    }
  ],
  "tracks": [
    {
      "id": "track_id",
      "title": "Track Title",
      "duration": 180,
      "album": {
        "id": "album_id",
        "title": "Album Title",
        "coverArtUrl": "https://..."
      }
    }
  ]
}
```

---

## Playlists API

### List Playlists

Get user's playlists.

**Endpoint:** `GET /api/playlists`

**Query Parameters:**
- `includePublic` (optional) - Include public playlists from other users (default: false)

**Response:**
```json
{
  "playlists": [
    {
      "id": "playlist_id",
      "name": "My Playlist",
      "description": "Description...",
      "isPublic": false,
      "coverImageUrl": "https://...",
      "user": {
        "id": "user_id",
        "name": "User Name",
        "avatarUrl": "https://..."
      },
      "_count": {
        "tracks": 25
      }
    }
  ]
}
```

### Create Playlist

Create a new playlist.

**Endpoint:** `POST /api/playlists`

**Request Body:**
```json
{
  "name": "My Playlist",
  "description": "Description...",
  "isPublic": false,
  "coverImageUrl": "https://..."
}
```

**Response:** `201 Created` with playlist object

### Get Playlist by ID

Get playlist details with all tracks.

**Endpoint:** `GET /api/playlists/[id]`

**Response:**
```json
{
  "id": "playlist_id",
  "name": "My Playlist",
  "description": "Description...",
  "isPublic": false,
  "totalDuration": 4500,
  "trackCount": 25,
  "user": {
    "id": "user_id",
    "name": "User Name",
    "avatarUrl": "https://..."
  },
  "tracks": [
    {
      "id": "playlist_track_id",
      "position": 0,
      "track": {
        "id": "track_id",
        "title": "Track Title",
        "duration": 180,
        "artist": {
          "id": "artist_id",
          "name": "Artist Name"
        },
        "album": {
          "id": "album_id",
          "title": "Album Title",
          "coverArtUrl": "https://..."
        }
      }
    }
  ]
}
```

### Update Playlist

Update playlist details.

**Endpoint:** `PUT /api/playlists/[id]`

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "isPublic": true,
  "coverImageUrl": "https://..."
}
```

**Response:** `200 OK` with updated playlist object

### Delete Playlist

Delete a playlist.

**Endpoint:** `DELETE /api/playlists/[id]`

**Response:** `200 OK`

---

## Playlist Tracks API

### Add Track to Playlist

Add a track to a playlist.

**Endpoint:** `POST /api/playlists/[id]/tracks`

**Request Body:**
```json
{
  "trackId": "track_id",
  "position": 0
}
```

Note: If `position` is not provided, the track will be added at the end.

**Response:** `201 Created` with playlist track object

### Remove Track from Playlist

Remove a track from a playlist.

**Endpoint:** `DELETE /api/playlists/[id]/tracks?trackId=track_id`

**Query Parameters:**
- `trackId` (required) - ID of the track to remove

**Response:** `200 OK`

---

## Favorites API

### List Favorites

Get user's favorite tracks.

**Endpoint:** `GET /api/favorites`

**Query Parameters:**
- `limit` (optional) - Number of favorites to return (default: 50, max: 100)
- `offset` (optional) - Number of favorites to skip (default: 0)

**Response:**
```json
{
  "favorites": [
    {
      "id": "favorite_id",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "track": {
        "id": "track_id",
        "title": "Track Title",
        "duration": 180,
        "artist": {
          "id": "artist_id",
          "name": "Artist Name",
          "imageUrl": "https://..."
        },
        "album": {
          "id": "album_id",
          "title": "Album Title",
          "coverArtUrl": "https://..."
        }
      }
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### Add to Favorites

Add a track to favorites.

**Endpoint:** `POST /api/favorites`

**Request Body:**
```json
{
  "trackId": "track_id"
}
```

**Response:** `201 Created` with favorite object

### Remove from Favorites

Remove a track from favorites.

**Endpoint:** `DELETE /api/favorites?trackId=track_id`

**Query Parameters:**
- `trackId` (required) - ID of the track to remove

**Response:** `200 OK`

---

## Play History API

### Get Play History

Get user's play history.

**Endpoint:** `GET /api/playhistory`

**Query Parameters:**
- `limit` (optional) - Number of history entries to return (default: 50, max: 100)
- `offset` (optional) - Number of entries to skip (default: 0)
- `completedOnly` (optional) - Only return completed plays (default: false)

**Response:**
```json
{
  "history": [
    {
      "id": "history_id",
      "playedAt": "2024-01-01T00:00:00.000Z",
      "completed": true,
      "track": {
        "id": "track_id",
        "title": "Track Title",
        "duration": 180,
        "artist": {
          "id": "artist_id",
          "name": "Artist Name",
          "imageUrl": "https://..."
        },
        "album": {
          "id": "album_id",
          "title": "Album Title",
          "coverArtUrl": "https://..."
        }
      }
    }
  ],
  "recentlyPlayed": ["track_id_1", "track_id_2", "..."],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Record Play

Record a track play event.

**Endpoint:** `POST /api/playhistory`

**Request Body:**
```json
{
  "trackId": "track_id",
  "completed": true
}
```

**Response:** `201 Created` with play history object

---

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common error codes:
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Not authorized to access this resource
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

---

## Example Usage

### Using curl

```bash
# List tracks (requires authentication cookie)
curl -X GET http://localhost:3000/api/tracks \
  -H "Cookie: next-auth.session-token=..."

# Create a playlist
curl -X POST http://localhost:3000/api/playlists \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"name": "My Playlist", "description": "My favorite songs"}'

# Add track to favorites
curl -X POST http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"trackId": "track_123"}'
```

### Using JavaScript fetch

```javascript
// List tracks
const response = await fetch('/api/tracks?limit=10');
const data = await response.json();

// Create playlist
const response = await fetch('/api/playlists', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Playlist',
    description: 'My favorite songs'
  })
});

// Add to favorites
await fetch('/api/favorites', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ trackId: 'track_123' })
});
```
