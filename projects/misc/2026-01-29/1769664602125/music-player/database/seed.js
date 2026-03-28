const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'music-player.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Initialize database
console.log('🚀 Initializing database...');
const db = new Database(DB_PATH);

// Execute schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);
console.log('✅ Schema created');

// Seed data
console.log('🌱 Seeding database...');

// Create test user
const hashedPassword = bcrypt.hashSync('password123', 10);
const insertUser = db.prepare('INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)');
const userResult = insertUser.run('test@example.com', hashedPassword, 'testuser');
const userId = userResult.lastInsertRowid;
console.log(`✅ Created user: testuser (ID: ${userId})`);

// Sample tracks data
const tracks = [
  { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration: 354 },
  { title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', duration: 482 },
  { title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', duration: 391 },
  { title: 'Imagine', artist: 'John Lennon', album: 'Imagine', duration: 183 },
  { title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller', duration: 294 },
  { title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', duration: 301 },
  { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', album: 'Appetite for Destruction', duration: 356 },
  { title: 'Dream On', artist: 'Aerosmith', album: 'Aerosmith', duration: 265 },
  { title: 'Wonderwall', artist: 'Oasis', album: '(What\'s the Story) Morning Glory?', duration: 258 },
  { title: 'November Rain', artist: 'Guns N\' Roses', album: 'Use Your Illusion I', duration: 537 },
  { title: 'Comfortably Numb', artist: 'Pink Floyd', album: 'The Wall', duration: 382 },
  { title: 'Under Pressure', artist: 'Queen & David Bowie', album: 'Hot Space', duration: 248 },
  { title: 'Purple Haze', artist: 'Jimi Hendrix', album: 'Are You Experienced', duration: 170 },
  { title: 'Yesterday', artist: 'The Beatles', album: 'Help!', duration: 125 },
  { title: 'Hallelujah', artist: 'Leonard Cohen', album: 'Various Positions', duration: 272 },
  { title: 'What\'s Going On', artist: 'Marvin Gaye', album: 'What\'s Going On', duration: 232 },
  { title: 'Respect', artist: 'Aretha Franklin', album: 'I Never Loved a Man the Way I Love You', duration: 148 },
  { title: 'Good Vibrations', artist: 'The Beach Boys', album: 'Smiley Smile', duration: 219 },
  { title: 'Like a Rolling Stone', artist: 'Bob Dylan', album: 'Highway 61 Revisited', duration: 369 },
  { title: 'One', artist: 'U2', album: 'Achtung Baby', duration: 276 },
  { title: 'Heroes', artist: 'David Bowie', album: 'Heroes', duration: 370 },
  { title: 'Born to Run', artist: 'Bruce Springsteen', album: 'Born to Run', duration: 270 },
  { title: 'Crazy', artist: 'Patsy Cline', album: 'Showcase', duration: 178 },
  { title: 'Take Five', artist: 'Dave Brubeck', album: 'Time Out', duration: 324 },
  { title: 'What a Wonderful World', artist: 'Louis Armstrong', album: 'What a Wonderful World', duration: 140 },
  { title: 'Summertime', artist: 'Ella Fitzgerald & Louis Armstrong', album: 'Porgy and Bess', duration: 252 },
  { title: 'My Way', artist: 'Frank Sinatra', album: 'My Way', duration: 275 },
  { title: 'Stand By Me', artist: 'Ben E. King', album: 'Don\'t Play That Song!', duration: 179 },
  { title: 'I Want to Hold Your Hand', artist: 'The Beatles', album: 'Meet the Beatles!', duration: 145 },
  { title: 'California Dreamin\'', artist: 'The Mamas & the Papas', album: 'If You Can Believe Your Eyes and Ears', duration: 163 },
  { title: 'Bridge Over Troubled Water', artist: 'Simon & Garfunkel', album: 'Bridge Over Troubled Water', duration: 292 },
  { title: 'God Only Knows', artist: 'The Beach Boys', album: 'Pet Sounds', duration: 169 },
  { title: 'A Change Is Gonna Come', artist: 'Sam Cooke', album: 'Ain\'t That Good News', duration: 191 },
  { title: 'Georgia on My Mind', artist: 'Ray Charles', album: 'The Genius Hits the Road', duration: 217 },
  { title: 'Johnny B. Goode', artist: 'Chuck Berry', album: 'Chuck Berry Is on Top', duration: 161 },
  { title: 'Superstition', artist: 'Stevie Wonder', album: 'Talking Book', duration: 245 },
  { title: 'Hey Jude', artist: 'The Beatles', album: 'Hey Jude', duration: 431 },
  { title: 'Let It Be', artist: 'The Beatles', album: 'Let It Be', duration: 243 },
  { title: 'Gimme Shelter', artist: 'The Rolling Stones', album: 'Let It Bleed', duration: 272 },
  { title: 'Layla', artist: 'Derek and the Dominos', album: 'Layla and Other Assorted Love Songs', duration: 427 },
];

const insertTrack = db.prepare('INSERT INTO tracks (title, artist, album, duration, cover_url) VALUES (?, ?, ?, ?, ?)');
const trackIds = [];
for (const track of tracks) {
  const result = insertTrack.run(
    track.title,
    track.artist,
    track.album,
    track.duration,
    `https://via.placeholder.com/300x300?text=${encodeURIComponent(track.album.substring(0, 20))}`
  );
  trackIds.push(result.lastInsertRowid);
}
console.log(`✅ Created ${trackIds.length} tracks`);

// Create sample playlists
const playlists = [
  { title: 'Classic Rock Legends', description: 'The greatest rock anthems of all time', tracks: [0, 1, 2, 6, 9, 10, 38, 39] },
  { title: 'Timeless Ballads', description: 'Beautiful songs that touch the soul', tracks: [3, 7, 14, 19, 20, 22, 30] },
  { title: 'Jazz & Soul Classics', description: 'Smooth jazz and soulful melodies', tracks: [15, 16, 23, 24, 25, 32, 33, 34, 35] },
  { title: '60s & 70s Hits', description: 'Golden era of music', tracks: [12, 13, 17, 18, 21, 28, 29, 31] },
  { title: 'Rock Essentials', description: 'Must-have rock tracks', tracks: [5, 6, 8, 11, 20, 21, 36] },
  { title: 'Chill Vibes', description: 'Relaxing tunes for any mood', tracks: [4, 14, 24, 26, 27, 30, 32] },
];

const insertPlaylist = db.prepare('INSERT INTO playlists (user_id, title, description) VALUES (?, ?, ?)');
const insertPlaylistTrack = db.prepare('INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)');

for (const playlist of playlists) {
  const playlistResult = insertPlaylist.run(userId, playlist.title, playlist.description);
  const playlistId = playlistResult.lastInsertRowid;

  playlist.tracks.forEach((trackIndex, position) => {
    const trackId = trackIds[trackIndex];
    insertPlaylistTrack.run(playlistId, trackId, position);
  });

  console.log(`✅ Created playlist: ${playlist.title} with ${playlist.tracks.length} tracks`);
}

// Add some tracks to user library
const insertLibraryTrack = db.prepare('INSERT INTO user_library (user_id, track_id) VALUES (?, ?)');
const favoriteTrackIndices = [0, 3, 4, 5, 10, 13, 14, 19, 20];
for (const trackIndex of favoriteTrackIndices) {
  insertLibraryTrack.run(userId, trackIds[trackIndex]);
}
console.log(`✅ Added ${favoriteTrackIndices.length} tracks to user library`);

db.close();
console.log('🎉 Database seeded successfully!');
console.log(`\nDatabase location: ${DB_PATH}`);
console.log('\nTest credentials:');
console.log('  Email: test@example.com');
console.log('  Password: password123');
