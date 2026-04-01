/**
 * Prisma Seed Script
 * Populates the database with sample music data for development and testing
 */

/**
 * Prisma Seed Script
 * Populates the database with sample music data for development and testing
 */

import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data (in development)
  console.log('🧹 Cleaning existing data...')
  await prisma.playHistory.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.playlistTrack.deleteMany()
  await prisma.playlist.deleteMany()
  await prisma.track.deleteMany()
  await prisma.album.deleteMany()
  await prisma.artist.deleteMany()
  await prisma.user.deleteMany()

  // Create Users
  console.log('👤 Creating users...')
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john@example.com',
        passwordHash: '$2a$10$YourHashedPasswordHere', // In real app, use bcrypt.hash()
        name: 'John Doe',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane@example.com',
        passwordHash: '$2a$10$YourHashedPasswordHere',
        name: 'Jane Smith',
        avatarUrl: 'https://i.pravatar.cc/150?img=2',
      },
    }),
  ])
  console.log(`✅ Created ${users.length} users`)

  // Create Artists
  console.log('🎤 Creating artists...')
  const artists = await Promise.all([
    prisma.artist.create({
      data: {
        name: 'The Midnight',
        bio: 'An American electronic music duo known for synthwave and retrowave',
        imageUrl: 'https://placehold.co/600x600/4A5568/FFF?text=The+Midnight',
      },
    }),
    prisma.artist.create({
      data: {
        name: 'CHVRCHES',
        bio: 'Scottish synth-pop band from Glasgow',
        imageUrl: 'https://placehold.co/600x600/7C3AED/FFF?text=CHVRCHES',
      },
    }),
    prisma.artist.create({
      data: {
        name: 'Daft Punk',
        bio: 'French electronic music duo formed in 1993',
        imageUrl: 'https://placehold.co/600x600/F59E0B/FFF?text=Daft+Punk',
      },
    }),
    prisma.artist.create({
      data: {
        name: 'M83',
        bio: 'French electronic music project led by Anthony Gonzalez',
        imageUrl: 'https://placehold.co/600x600/EC4899/FFF?text=M83',
      },
    }),
    prisma.artist.create({
      data: {
        name: 'Porter Robinson',
        bio: 'American DJ, record producer, and singer from Chapel Hill',
        imageUrl: 'https://placehold.co/600x600/10B981/FFF?text=Porter+Robinson',
      },
    }),
  ])
  console.log(`✅ Created ${artists.length} artists`)

  // Create Albums
  console.log('💿 Creating albums...')
  const albums = await Promise.all([
    // The Midnight albums
    prisma.album.create({
      data: {
        title: 'Endless Summer',
        artistId: artists[0].id,
        coverArtUrl: 'https://placehold.co/600x600/4A5568/FFF?text=Endless+Summer',
        releaseDate: new Date('2016-08-05'),
      },
    }),
    prisma.album.create({
      data: {
        title: 'Monsters',
        artistId: artists[0].id,
        coverArtUrl: 'https://placehold.co/600x600/6366F1/FFF?text=Monsters',
        releaseDate: new Date('2020-07-10'),
      },
    }),
    // CHVRCHES albums
    prisma.album.create({
      data: {
        title: 'The Bones of What You Believe',
        artistId: artists[1].id,
        coverArtUrl: 'https://placehold.co/600x600/7C3AED/FFF?text=The+Bones',
        releaseDate: new Date('2013-09-20'),
      },
    }),
    prisma.album.create({
      data: {
        title: 'Love Is Dead',
        artistId: artists[1].id,
        coverArtUrl: 'https://placehold.co/600x600/DB2777/FFF?text=Love+Is+Dead',
        releaseDate: new Date('2018-05-25'),
      },
    }),
    // Daft Punk album
    prisma.album.create({
      data: {
        title: 'Random Access Memories',
        artistId: artists[2].id,
        coverArtUrl: 'https://placehold.co/600x600/F59E0B/FFF?text=RAM',
        releaseDate: new Date('2013-05-17'),
      },
    }),
    // M83 album
    prisma.album.create({
      data: {
        title: 'Hurry Up, We\'re Dreaming',
        artistId: artists[3].id,
        coverArtUrl: 'https://placehold.co/600x600/EC4899/FFF?text=HUWD',
        releaseDate: new Date('2011-10-18'),
      },
    }),
    // Porter Robinson album
    prisma.album.create({
      data: {
        title: 'Nurture',
        artistId: artists[4].id,
        coverArtUrl: 'https://placehold.co/600x600/10B981/FFF?text=Nurture',
        releaseDate: new Date('2021-04-23'),
      },
    }),
  ])
  console.log(`✅ Created ${albums.length} albums`)

  // Create Tracks
  console.log('🎵 Creating tracks...')
  const tracks = await Promise.all([
    // The Midnight - Endless Summer
    prisma.track.create({
      data: {
        title: 'Sunset',
        artistId: artists[0].id,
        albumId: albums[0].id,
        duration: 242,
        audioUrl: '/audio/sample-1.mp3',
        trackNumber: 1,
      },
    }),
    prisma.track.create({
      data: {
        title: 'Endless Summer',
        artistId: artists[0].id,
        albumId: albums[0].id,
        duration: 258,
        audioUrl: '/audio/sample-2.mp3',
        trackNumber: 2,
      },
    }),
    prisma.track.create({
      data: {
        title: 'Jason',
        artistId: artists[0].id,
        albumId: albums[0].id,
        duration: 275,
        audioUrl: '/audio/sample-3.mp3',
        trackNumber: 3,
      },
    }),
    // The Midnight - Monsters
    prisma.track.create({
      data: {
        title: 'America Online',
        artistId: artists[0].id,
        albumId: albums[1].id,
        duration: 234,
        audioUrl: '/audio/sample-4.mp3',
        trackNumber: 1,
      },
    }),
    prisma.track.create({
      data: {
        title: 'Monsters',
        artistId: artists[0].id,
        albumId: albums[1].id,
        duration: 267,
        audioUrl: '/audio/sample-5.mp3',
        trackNumber: 2,
      },
    }),
    // CHVRCHES - The Bones of What You Believe
    prisma.track.create({
      data: {
        title: 'The Mother We Share',
        artistId: artists[1].id,
        albumId: albums[2].id,
        duration: 193,
        audioUrl: '/audio/sample-6.mp3',
        trackNumber: 1,
      },
    }),
    prisma.track.create({
      data: {
        title: 'Gun',
        artistId: artists[1].id,
        albumId: albums[2].id,
        duration: 224,
        audioUrl: '/audio/sample-7.mp3',
        trackNumber: 2,
      },
    }),
    prisma.track.create({
      data: {
        title: 'Recover',
        artistId: artists[1].id,
        albumId: albums[2].id,
        duration: 234,
        audioUrl: '/audio/sample-8.mp3',
        trackNumber: 3,
      },
    }),
    // CHVRCHES - Love Is Dead
    prisma.track.create({
      data: {
        title: 'Graffiti',
        artistId: artists[1].id,
        albumId: albums[3].id,
        duration: 201,
        audioUrl: '/audio/sample-9.mp3',
        trackNumber: 1,
      },
    }),
    prisma.track.create({
      data: {
        title: 'Get Out',
        artistId: artists[1].id,
        albumId: albums[3].id,
        duration: 233,
        audioUrl: '/audio/sample-10.mp3',
        trackNumber: 2,
      },
    }),
    // Daft Punk - Random Access Memories
    prisma.track.create({
      data: {
        title: 'Get Lucky',
        artistId: artists[2].id,
        albumId: albums[4].id,
        duration: 369,
        audioUrl: '/audio/sample-11.mp3',
        trackNumber: 1,
      },
    }),
    prisma.track.create({
      data: {
        title: 'Instant Crush',
        artistId: artists[2].id,
        albumId: albums[4].id,
        duration: 337,
        audioUrl: '/audio/sample-12.mp3',
        trackNumber: 2,
      },
    }),
    prisma.track.create({
      data: {
        title: 'Lose Yourself to Dance',
        artistId: artists[2].id,
        albumId: albums[4].id,
        duration: 353,
        audioUrl: '/audio/sample-13.mp3',
        trackNumber: 3,
      },
    }),
    // M83 - Hurry Up, We're Dreaming
    prisma.track.create({
      data: {
        title: 'Midnight City',
        artistId: artists[3].id,
        albumId: albums[5].id,
        duration: 244,
        audioUrl: '/audio/sample-14.mp3',
        trackNumber: 1,
      },
    }),
    prisma.track.create({
      data: {
        title: 'Wait',
        artistId: artists[3].id,
        albumId: albums[5].id,
        duration: 377,
        audioUrl: '/audio/sample-15.mp3',
        trackNumber: 2,
      },
    }),
    // Porter Robinson - Nurture
    prisma.track.create({
      data: {
        title: 'Get Your Wish',
        artistId: artists[4].id,
        albumId: albums[6].id,
        duration: 228,
        audioUrl: '/audio/sample-16.mp3',
        trackNumber: 1,
      },
    }),
    prisma.track.create({
      data: {
        title: 'Something Comforting',
        artistId: artists[4].id,
        albumId: albums[6].id,
        duration: 274,
        audioUrl: '/audio/sample-17.mp3',
        trackNumber: 2,
      },
    }),
    prisma.track.create({
      data: {
        title: 'Look at the Sky',
        artistId: artists[4].id,
        albumId: albums[6].id,
        duration: 293,
        audioUrl: '/audio/sample-18.mp3',
        trackNumber: 3,
      },
    }),
  ])
  console.log(`✅ Created ${tracks.length} tracks`)

  // Create Playlists
  console.log('📝 Creating playlists...')
  const playlists = await Promise.all([
    prisma.playlist.create({
      data: {
        userId: users[0].id,
        name: 'My Favorites',
        description: 'A collection of my all-time favorite tracks',
        isPublic: true,
        coverImageUrl: 'https://placehold.co/600x600/6366F1/FFF?text=Favorites',
      },
    }),
    prisma.playlist.create({
      data: {
        userId: users[0].id,
        name: 'Workout Mix',
        description: 'High-energy tracks to keep me motivated',
        isPublic: false,
        coverImageUrl: 'https://placehold.co/600x600/EF4444/FFF?text=Workout',
      },
    }),
    prisma.playlist.create({
      data: {
        userId: users[1].id,
        name: 'Chill Vibes',
        description: 'Relaxing electronic music for focus and relaxation',
        isPublic: true,
        coverImageUrl: 'https://placehold.co/600x600/10B981/FFF?text=Chill',
      },
    }),
  ])
  console.log(`✅ Created ${playlists.length} playlists`)

  // Add tracks to playlists
  console.log('🔗 Adding tracks to playlists...')
  const playlistTracks = await Promise.all([
    // My Favorites playlist
    prisma.playlistTrack.create({
      data: { playlistId: playlists[0].id, trackId: tracks[10].id, position: 0 }, // Get Lucky
    }),
    prisma.playlistTrack.create({
      data: { playlistId: playlists[0].id, trackId: tracks[13].id, position: 1 }, // Midnight City
    }),
    prisma.playlistTrack.create({
      data: { playlistId: playlists[0].id, trackId: tracks[5].id, position: 2 }, // The Mother We Share
    }),
    prisma.playlistTrack.create({
      data: { playlistId: playlists[0].id, trackId: tracks[17].id, position: 3 }, // Look at the Sky
    }),
    // Workout Mix playlist
    prisma.playlistTrack.create({
      data: { playlistId: playlists[1].id, trackId: tracks[6].id, position: 0 }, // Gun
    }),
    prisma.playlistTrack.create({
      data: { playlistId: playlists[1].id, trackId: tracks[8].id, position: 1 }, // Graffiti
    }),
    prisma.playlistTrack.create({
      data: { playlistId: playlists[1].id, trackId: tracks[12].id, position: 2 }, // Lose Yourself to Dance
    }),
    // Chill Vibes playlist
    prisma.playlistTrack.create({
      data: { playlistId: playlists[2].id, trackId: tracks[1].id, position: 0 }, // Endless Summer
    }),
    prisma.playlistTrack.create({
      data: { playlistId: playlists[2].id, trackId: tracks[14].id, position: 1 }, // Wait
    }),
    prisma.playlistTrack.create({
      data: { playlistId: playlists[2].id, trackId: tracks[16].id, position: 2 }, // Something Comforting
    }),
  ])
  console.log(`✅ Added ${playlistTracks.length} tracks to playlists`)

  // Create Favorites
  console.log('❤️ Creating favorites...')
  const favorites = await Promise.all([
    prisma.favorite.create({
      data: { userId: users[0].id, trackId: tracks[10].id }, // Get Lucky
    }),
    prisma.favorite.create({
      data: { userId: users[0].id, trackId: tracks[13].id }, // Midnight City
    }),
    prisma.favorite.create({
      data: { userId: users[0].id, trackId: tracks[5].id }, // The Mother We Share
    }),
    prisma.favorite.create({
      data: { userId: users[1].id, trackId: tracks[1].id }, // Endless Summer
    }),
    prisma.favorite.create({
      data: { userId: users[1].id, trackId: tracks[17].id }, // Look at the Sky
    }),
  ])
  console.log(`✅ Created ${favorites.length} favorites`)

  // Create Play History
  console.log('📊 Creating play history...')
  const now = new Date()
  const playHistory = await Promise.all([
    // User 1 play history
    prisma.playHistory.create({
      data: {
        userId: users[0].id,
        trackId: tracks[10].id,
        playedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
        completed: true,
      },
    }),
    prisma.playHistory.create({
      data: {
        userId: users[0].id,
        trackId: tracks[13].id,
        playedAt: new Date(now.getTime() - 1000 * 60 * 60 * 1), // 1 hour ago
        completed: true,
      },
    }),
    prisma.playHistory.create({
      data: {
        userId: users[0].id,
        trackId: tracks[5].id,
        playedAt: new Date(now.getTime() - 1000 * 60 * 30), // 30 minutes ago
        completed: false,
      },
    }),
    // User 2 play history
    prisma.playHistory.create({
      data: {
        userId: users[1].id,
        trackId: tracks[1].id,
        playedAt: new Date(now.getTime() - 1000 * 60 * 60 * 3), // 3 hours ago
        completed: true,
      },
    }),
    prisma.playHistory.create({
      data: {
        userId: users[1].id,
        trackId: tracks[14].id,
        playedAt: new Date(now.getTime() - 1000 * 60 * 45), // 45 minutes ago
        completed: true,
      },
    }),
  ])
  console.log(`✅ Created ${playHistory.length} play history entries`)

  console.log('✨ Database seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   Users: ${users.length}`)
  console.log(`   Artists: ${artists.length}`)
  console.log(`   Albums: ${albums.length}`)
  console.log(`   Tracks: ${tracks.length}`)
  console.log(`   Playlists: ${playlists.length}`)
  console.log(`   Playlist Tracks: ${playlistTracks.length}`)
  console.log(`   Favorites: ${favorites.length}`)
  console.log(`   Play History: ${playHistory.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
