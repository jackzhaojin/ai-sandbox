# Research Findings: Full-Stack Music Player Platform

## Research Completed: 2026-01-29

### 1. Next.js Router Decision: App Router vs Pages Router

**Decision: Use App Router (Next.js 14+)**

**Rationale:**
- App Router is the modern, recommended approach as of Next.js 13+ and continues in Next.js 14/15
- Better support for React Server Components and Server Actions
- More natural integration with server-side authentication
- Improved performance and developer experience
- Industry is moving towards App Router for new projects

**Trade-offs:**
- Slightly steeper learning curve
- Some community examples still use Pages Router
- Pages Router remains fully supported for legacy compatibility

### 2. Authentication Strategy

**Decision: JWT with httpOnly Cookies + Server Actions**

**Implementation Plan:**
- Use `jose` library for JWT encryption/decryption
- Store JWT in httpOnly cookies with `secure`, `sameSite: 'lax'` flags
- Implement authentication via Server Actions (`"use server"`)
- Use `cookies()` from `next/headers` for cookie management
- Session verification in middleware before rendering protected pages

**Security Best Practices (2026):**
- httpOnly cookies prevent XSS attacks
- Short-lived JWT tokens (e.g., 1-2 hours)
- Minimum data in JWT payload (user ID, role only)
- No PII or sensitive data in tokens
- CSRF protection via sameSite cookie flag

**Critical Security Note:**
- Next.js CVE-2025-29927 (CVSS 9.1) allows middleware bypass
- Must use Next.js 15.2.3+, 14.2.25+, 13.5.9+, or 12.3.5+
- We'll use latest stable Next.js 14.x or 15.x

### 3. Database Strategy

**Decision: better-sqlite3 with SQLite**

**Rationale:**
- Simple, file-based database (no separate server needed)
- Synchronous API works well with Next.js API routes
- Perfect for development and small-scale production
- Easy migration path to PostgreSQL if needed later
- Built-in ACID compliance

**Schema Design:**
```
Users (id, email, password_hash, username, created_at)
Playlists (id, user_id, title, description, created_at)
Tracks (id, title, artist, album, duration, file_url, cover_url)
PlaylistTracks (playlist_id, track_id, position, added_at)
UserLibrary (user_id, track_id, saved_at)
```

### 4. UI Layout Strategy

**Decision: Three-Panel Layout with CSS Grid/Flexbox**

**Components:**
1. **Left Sidebar** (fixed width, ~240px)
   - Playlists list
   - "Liked Songs" section
   - Create playlist button
   - Scrollable

2. **Main Content** (flexible)
   - Current playlist/view header
   - Track list table
   - Search interface
   - Scrollable independently

3. **Bottom Player Bar** (fixed height, ~90px)
   - Now playing track info
   - Playback controls (play/pause, next, prev)
   - Progress bar
   - Volume control
   - Fixed at bottom

**Layout Approach:**
- CSS Grid for main layout structure
- Flexbox for component internals
- TailwindCSS for rapid styling
- Responsive design (collapse sidebar on mobile)

### 5. State Management

**Decision: React Context + Server State**

**Rationale:**
- React Context for client-side player state (current track, playing status)
- Server Components for data fetching (playlists, tracks)
- Server Actions for mutations (create playlist, add track)
- No need for Redux/Zustand for this scope
- Simpler architecture, less boilerplate

### 6. Technology Stack Summary

**Frontend:**
- Next.js 14.x (App Router)
- React 18+
- TailwindCSS
- TypeScript (if simple enough, plain JS)

**Backend:**
- Next.js API Routes (App Router style)
- better-sqlite3
- jose (JWT)
- bcrypt (password hashing)

**Development:**
- ESLint
- Prettier (optional)
- Node.js 18+

### 7. Project Structure

```
music-player/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (protected)/
│   │   ├── layout.tsx (three-panel layout)
│   │   ├── page.tsx (home/library)
│   │   ├── playlist/[id]/
│   │   └── profile/
│   ├── api/
│   │   ├── auth/
│   │   ├── playlists/
│   │   ├── library/
│   │   └── search/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── Sidebar.tsx
│   ├── Player.tsx
│   ├── TrackList.tsx
│   └── ...
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   └── utils.ts
├── database/
│   ├── schema.sql
│   └── seed.js
├── middleware.ts
└── package.json
```

### 8. Implementation Phases

**Phase 1: Foundation**
- Initialize Next.js project
- Set up database schema and seed data
- Configure TailwindCSS

**Phase 2: Authentication**
- Implement registration/login API
- Create auth pages
- Set up middleware protection
- Session management

**Phase 3: Core API**
- Playlists CRUD endpoints
- Track management endpoints
- Search endpoint
- Library endpoints

**Phase 4: UI Components**
- Three-panel layout
- Sidebar with playlists
- Track list component
- Player controls (UI only, no real audio)

**Phase 5: Integration**
- Connect frontend to API
- State management
- User flows
- Error handling

**Phase 6: Testing & Polish**
- End-to-end testing
- Bug fixes
- UI polish

## References

### Authentication & Security
- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication)
- [Next.js Secure Authentication using cookies and server actions](https://stackademic.com/blog/next-js-secure-authentication-using-cookies-and-server-actions-b24b8b31e01b)
- [NextAuth.js 2025: Secure Authentication for Next.js Apps](https://strapi.io/blog/nextauth-js-secure-authentication-next-js-guide)

### App Router vs Pages Router
- [App Router vs Pages Router in Next.js — a deep, practical guide](https://dev.to/shyam0118/app-router-vs-pages-router-in-nextjs-a-deep-practical-guide-341g)
- [Complete Authentication Guide for Next.js App Router in 2025](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router)

### Music Player Examples
- [GitHub - Next-Spotify v2 (App Router)](https://github.com/ankitk26/Next-Spotify-v2)
- [How to Build a Spotify Clone with Next.js and Cosmic](https://www.cosmicjs.com/blog/how-to-build-a-spotify-clone-with-nextjs-and-cosmic)

## Next Steps

1. Initialize Next.js 14 project with App Router
2. Install dependencies (better-sqlite3, jose, bcrypt, tailwindcss)
3. Create database schema and seed script
4. Implement authentication system
5. Build API endpoints
6. Create UI components and layout
7. Integrate and test

## Risk Assessment

**Low Risk Items:**
- Next.js setup and configuration
- Database schema design
- UI component creation
- TailwindCSS styling

**Medium Risk Items:**
- JWT authentication implementation (needs security testing)
- Middleware configuration (must avoid CVE-2025-29927)
- Three-panel layout responsiveness

**Mitigation:**
- Use latest Next.js version (14.2.25+ or 15.2.3+)
- Follow official Next.js auth patterns
- Test authentication flows thoroughly
- Progressive enhancement for layout
