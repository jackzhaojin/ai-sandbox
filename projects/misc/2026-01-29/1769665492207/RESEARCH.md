# Research Findings: Full-Stack Conversational Chat Application

## Problem Analysis

Build a multi-room chat application with:
- User authentication (JWT + httpOnly cookies)
- Persistent conversations (SQLite database)
- Real-time-feeling updates
- Bot responses with simulated delays
- Polished conversational UI with animations
- User profiles and settings

## Technology Decisions

### Framework: Next.js 14 App Router

**Why App Router:**
- Server Actions for secure mutations (posting messages, auth operations)
- Server Components by default = better performance
- Built-in API Routes via Route Handlers
- Better folder structure for large applications
- Native support for loading states and streaming

**References:**
- [Next.js Tips for 2026](https://medium.com/@Amanda0/next-js-tips-for-2026-a-comprehensive-guide-to-building-high-performance-scalable-web-c1898366c28d)
- [Next.js 14 Mindset: App Router Guide](https://medium.com/@lupucl/next-js-14-mindset-a-beginners-guide-to-the-app-router-bb419493c558)
- [Next.js App Router Guides](https://nextjs.org/docs/app/guides)

### Database: better-sqlite3

**Why:**
- Synchronous API = simpler code, no async complexity
- Perfect for single-instance apps
- Fast and lightweight
- Easy migrations with raw SQL

**Schema Design:**
```sql
Users (id, username, email, passwordHash, avatarColor, createdAt)
Conversations (id, title, createdBy, createdAt, updatedAt)
ConversationMembers (conversationId, userId, role)
Messages (id, conversationId, senderId, content, type, createdAt)
Reactions (messageId, userId, emoji)
```

**References:**
- [Using SQLite with Next.js 13](https://plainenglish.io/blog/using-sqlite-with-next-js-13)
- [Portfolio with Next.js and SQLite](https://krimsonhart.medium.com/how-i-built-my-portfolio-using-next-js-and-sqlite-db-part-3-00b76d532375)

### Authentication: JWT with httpOnly Cookies

**Why:**
- httpOnly cookies prevent XSS attacks
- Secure flag ensures HTTPS-only transmission
- SameSite='lax' prevents CSRF
- Server-side validation on every request

**Implementation:**
- Use `jose` library for JWT signing/verification
- Use `bcrypt` for password hashing
- Middleware to protect routes
- Server Actions for auth mutations

**References:**
- [Next.js Authentication Guide 2025](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router)
- [Next.js HTTP-Only Cookie Auth](https://maxschmitt.me/posts/next-js-http-only-cookie-auth-tokens)
- [NextJS Authentication Flow with JWT Cookies](https://javascript.plainenglish.io/nextjs-authentication-flow-store-jwt-in-cookie-fa6e6c8c0dca)
- [Next.js Official Authentication Guide](https://nextjs.org/docs/app/guides/authentication)

### Real-time Updates: Polling Strategy

**Why not WebSockets:**
- Adds complexity (separate server process)
- Overkill for "real-time-feeling" (not true real-time required)
- Harder to deploy

**Polling approach:**
- Client polls for new messages every 2-3 seconds
- Optimistic updates when sending messages
- Use React Query or SWR for data fetching with polling
- Sufficient for chat app feel without WebSocket complexity

### UI Architecture

**Structure:**
```
app/
├── (auth)/          # Auth group - login/register pages
│   ├── login/
│   └── register/
├── (app)/           # Main app group - protected routes
│   ├── conversations/
│   │   ├── page.tsx         # List view
│   │   └── [id]/page.tsx    # Chat view
│   ├── profile/
│   └── settings/
├── api/             # API routes
│   ├── auth/
│   ├── conversations/
│   └── messages/
└── components/      # Shared components
    ├── ui/          # Base UI components
    └── chat/        # Chat-specific components
```

**UI Libraries:**
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons
- shadcn/ui for base components (optional, can build from scratch)

## Implementation Plan

### Phase 1: Foundation (Setup & Auth)
1. Initialize Next.js 14 project with App Router
2. Set up Tailwind CSS
3. Create database schema and initialization script
4. Implement authentication system (JWT + httpOnly cookies)
5. Create login/register pages
6. Implement middleware for route protection

### Phase 2: Core Features (Conversations & Messages)
1. Build API endpoints for conversations and messages
2. Create conversation list page
3. Build chat interface with message rendering
4. Implement message sending with optimistic updates
5. Add bot response simulation (random delay + curated responses)
6. Implement message pagination

### Phase 3: User Experience (Profile & Polish)
1. Create user profile page with stats
2. Build settings page (theme, display name)
3. Add animations to message list (fade in, slide in)
4. Implement emoji reactions
5. Add typing indicators simulation
6. Polish UI with loading states and error handling

### Phase 4: Data & Testing
1. Create comprehensive seed script
2. Test all authentication flows
3. Test conversation creation and messaging
4. Verify all Definition of Done items
5. Final polish and bug fixes

## Key Technical Patterns

### Server Actions for Mutations
```typescript
// app/actions/messages.ts
'use server'
export async function sendMessage(conversationId: string, content: string) {
  const session = await getSession()
  // Insert message into DB
  // Trigger bot response after delay
}
```

### API Route Handlers
```typescript
// app/api/conversations/[id]/messages/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Return paginated messages
}
```

### Middleware for Auth
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Verify JWT from httpOnly cookie
  // Redirect if not authenticated
}
```

### Database Utilities
```typescript
// lib/db.ts
import Database from 'better-sqlite3'
const db = new Database('chat.db')
// Export prepared statements
```

## Success Criteria Verification

This approach satisfies all requirements:
- ✅ JWT auth with httpOnly cookies
- ✅ SQLite database with defined schema
- ✅ All required API endpoints
- ✅ User profile and settings pages
- ✅ Conversation persistence
- ✅ Bot response simulation
- ✅ Animated chat UI
- ✅ Seed script for realistic data

## Risks & Mitigations

**Risk:** Better-sqlite3 is synchronous and might block on large queries
**Mitigation:** Use pagination, limit query complexity, consider async wrapper if needed

**Risk:** Polling creates unnecessary load
**Mitigation:** Use intelligent polling (only when tab is active), exponential backoff

**Risk:** JWT refresh token strategy not specified
**Mitigation:** Start with long-lived tokens (24h), can add refresh later if needed

## Next Steps

1. Initialize Next.js project
2. Install dependencies (better-sqlite3, jose, bcrypt, tailwindcss, framer-motion)
3. Set up database schema
4. Begin Phase 1 implementation
