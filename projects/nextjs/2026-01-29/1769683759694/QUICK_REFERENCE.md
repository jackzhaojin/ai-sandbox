# Quick Reference Guide

**For implementers of Steps 2-8**

This is a condensed reference. See RESEARCH.md for full details.

## Technology Stack at a Glance

```bash
# Core
Next.js 15 (App Router)
TypeScript 5.x
PostgreSQL 15+

# Data & Auth
Prisma 5.x (ORM)
NextAuth.js v5 (Authentication)

# State & UI
Zustand (Global state)
shadcn/ui (Component library)
Tailwind CSS (Styling)

# Audio
react-use-audio-player (HTML5 Audio wrapper)
```

## Project Structure (Planned)

```
music-player/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (main)/            # Main app pages
│   │   ├── browse/
│   │   ├── library/
│   │   ├── playlist/[id]/
│   │   └── search/
│   ├── api/               # API routes
│   │   ├── auth/
│   │   ├── tracks/
│   │   ├── playlists/
│   │   └── favorites/
│   └── layout.tsx         # Root layout (with player)
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── player/           # Audio player components
│   └── playlist/         # Playlist components
├── lib/                   # Utilities
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # NextAuth config
│   └── store.ts          # Zustand stores
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
└── public/
    └── audio/            # Audio files (temp storage)
```

## Database Schema (Summary)

### Core Tables
- **User** - id, email, password_hash, name, avatar_url
- **Artist** - id, name, bio, image_url
- **Album** - id, title, artist_id, cover_art_url, release_date
- **Track** - id, title, artist_id, album_id, duration, audio_url

### User Interaction Tables
- **Playlist** - id, user_id, name, description, is_public
- **PlaylistTrack** - id, playlist_id, track_id, position
- **Favorite** - id, user_id, track_id
- **PlayHistory** - id, user_id, track_id, played_at, completed

## API Endpoints (Summary)

```typescript
// Authentication
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout

// Tracks
GET    /api/tracks
GET    /api/tracks/:id
GET    /api/tracks/:id/stream

// Playlists
GET    /api/playlists
POST   /api/playlists
GET    /api/playlists/:id
PATCH  /api/playlists/:id
DELETE /api/playlists/:id
POST   /api/playlists/:id/tracks
DELETE /api/playlists/:id/tracks/:trackId

// Favorites
GET    /api/favorites
POST   /api/favorites/:trackId
DELETE /api/favorites/:trackId

// Search
GET    /api/search?q=query
```

## Key Code Patterns

### 1. Audio Player State (Zustand)

```typescript
// lib/store.ts
import { create } from 'zustand'

interface PlayerStore {
  currentTrack: Track | null
  queue: Track[]
  isPlaying: boolean
  play: (track: Track) => void
  pause: () => void
  next: () => void
  previous: () => void
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  play: (track) => set({ currentTrack: track, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  // ... more actions
}))
```

### 2. Audio Player Component

```typescript
// components/player/AudioPlayer.tsx
import { useAudioPlayer } from 'react-use-audio-player'

export function AudioPlayer({ trackUrl }: { trackUrl: string }) {
  const { play, pause, playing } = useAudioPlayer()

  return (
    <button onClick={() => playing ? pause() : play(trackUrl)}>
      {playing ? 'Pause' : 'Play'}
    </button>
  )
}
```

### 3. Protected Route (Middleware)

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token
  }
})

export const config = {
  matcher: ['/playlists/:path*', '/favorites/:path*']
}
```

### 4. API Route Example

```typescript
// app/api/playlists/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const playlists = await prisma.playlist.findMany({
    where: { userId: session.user.id }
  })

  return NextResponse.json({ data: playlists })
}
```

### 5. Prisma Schema Example

```prisma
// prisma/schema.prisma
model User {
  id            String      @id @default(cuid())
  email         String      @unique
  passwordHash  String      @map("password_hash")
  name          String?
  avatarUrl     String?     @map("avatar_url")
  playlists     Playlist[]
  favorites     Favorite[]
  playHistory   PlayHistory[]
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  @@map("users")
}

model Track {
  id          String   @id @default(cuid())
  title       String
  artistId    String   @map("artist_id")
  albumId     String   @map("album_id")
  duration    Int      // in seconds
  audioUrl    String   @map("audio_url")
  trackNumber Int?     @map("track_number")
  artist      Artist   @relation(fields: [artistId], references: [id])
  album       Album    @relation(fields: [albumId], references: [id])
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("tracks")
}
```

## Environment Variables Template

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/music_player"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

## Installation Commands (Step 2)

```bash
# Create Next.js project
npx create-next-app@latest music-player \
  --typescript \
  --tailwind \
  --app \
  --import-alias "@/*"

cd music-player

# Install dependencies
npm install prisma @prisma/client
npm install next-auth @auth/prisma-adapter
npm install zustand
npm install react-use-audio-player
npm install zod
npm install bcryptjs
npm install -D @types/bcryptjs

# Initialize Prisma
npx prisma init

# Install shadcn/ui
npx shadcn@latest init
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server

# Database
npx prisma migrate dev   # Create and apply migration
npx prisma db seed      # Seed database
npx prisma studio       # Open Prisma Studio

# Build
npm run build           # Build for production
npm start              # Start production server
```

## Key Design Principles

1. **Server Components by default** - Use Client Components only when needed (interactivity)
2. **Progressive enhancement** - Works without JavaScript where possible
3. **Type safety** - Use TypeScript, Zod for validation, Prisma for DB types
4. **Responsive design** - Mobile-first approach
5. **Accessibility** - WCAG 2.1 AA compliance

## Performance Targets

- **Lighthouse Score:** > 90 on all metrics
- **Initial Load:** < 2 seconds
- **Navigation:** < 500ms
- **Audio Start:** < 200ms after click

## Step-by-Step Checklist

### Step 2: Project Initialization
- [ ] Create Next.js project with TypeScript
- [ ] Install core dependencies
- [ ] Set up Tailwind CSS and shadcn/ui
- [ ] Create basic layout structure
- [ ] Configure environment variables

### Step 3: Database Setup
- [ ] Define Prisma schema
- [ ] Create migrations
- [ ] Seed database with sample data
- [ ] Test database connections

### Step 4: Authentication
- [ ] Configure NextAuth.js
- [ ] Create signup/login pages
- [ ] Implement route protection
- [ ] Test authentication flow

### Step 5: API Development
- [ ] Create API routes for all entities
- [ ] Implement CRUD operations
- [ ] Add search functionality
- [ ] Test all endpoints

### Step 6: UI Development
- [ ] Build audio player component
- [ ] Create all pages (home, browse, library, etc.)
- [ ] Implement responsive design
- [ ] Test on multiple devices

### Step 7: Integration
- [ ] Connect UI to API
- [ ] Implement Zustand state management
- [ ] Add all user interactions
- [ ] Test complete user flows

### Step 8: Testing & Polish
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Documentation

## Helpful Resources

- **Full Research:** See RESEARCH.md
- **Step Status:** See STEP_1_COMPLETE.md
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **NextAuth Docs:** https://next-auth.js.org
- **shadcn/ui:** https://ui.shadcn.com

## Questions During Implementation?

1. Check RESEARCH.md for detailed rationale
2. Reference cited sources in RESEARCH.md
3. Follow established patterns in similar open-source projects
4. When in doubt, prioritize simplicity and type safety

---

**Good luck with implementation!** 🚀
