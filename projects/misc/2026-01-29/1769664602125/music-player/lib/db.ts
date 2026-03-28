import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'database', 'music-player.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  username: string;
  created_at: string;
}

export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover_url: string | null;
  created_at: string;
}

export interface Playlist {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  created_at: string;
}

export interface PlaylistTrack {
  playlist_id: number;
  track_id: number;
  position: number;
  added_at: string;
}

export interface UserLibrary {
  user_id: number;
  track_id: number;
  saved_at: string;
}

// Helper to format duration from seconds to MM:SS
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
