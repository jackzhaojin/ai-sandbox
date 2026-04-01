# Step 4 Research: Authentication System

## Goal
Implement user authentication with JWT or session-based auth, including login/logout/register flows.

## Current State Analysis

### What We Have
- Next.js 16.1.6 (App Router)
- Prisma 5.22.0 with SQLite database
- User model with `email` and `passwordHash` fields
- No authentication system yet

### User Schema
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String?
  avatarUrl    String?  @map("avatar_url")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  playlists    Playlist[]
  favorites    Favorite[]
  playHistory  PlayHistory[]
}
```

## Authentication Approach Decision

### Option 1: NextAuth.js v5 (Auth.js)
**Pros:**
- Industry standard for Next.js
- Built-in OAuth support (Google, GitHub, etc.)
- Session management included
- Edge-compatible
- TypeScript support
- Works with both App Router and Pages Router

**Cons:**
- Learning curve for v5 (breaking changes from v4)
- Requires adapter configuration for Prisma
- More complex setup for simple email/password auth

### Option 2: Custom JWT Implementation
**Pros:**
- Full control over auth flow
- Simpler for email/password only
- No external dependencies
- Lighter weight

**Cons:**
- Need to implement session management manually
- Need to handle refresh tokens
- Security risks if not done correctly
- More maintenance burden

### Decision: NextAuth.js v5 with Credentials Provider

**Reasoning:**
1. **Future-proof** - Easy to add OAuth providers later (Google, Spotify, etc.)
2. **Security** - Battle-tested authentication patterns
3. **Session management** - Built-in session handling
4. **Best practices** - Follows industry standards
5. **App Router support** - First-class support for Next.js 15+

## Implementation Plan

### Phase 1: Install Dependencies
```bash
npm install next-auth@beta @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs
```

### Phase 2: Configure NextAuth.js
1. Create `lib/auth.ts` - Auth configuration
2. Create `app/api/auth/[...nextauth]/route.ts` - API route handler
3. Add JWT secret to `.env`

### Phase 3: Password Hashing
1. Create `lib/password.ts` - Password hashing utilities using bcryptjs
2. Functions: `hashPassword()` and `verifyPassword()`

### Phase 4: Auth API Routes
1. **POST /api/auth/register** - User registration
   - Validate email format
   - Check if user exists
   - Hash password
   - Create user in database
   - Return success/error

2. **POST /api/auth/signin** - Login (NextAuth handles this)
3. **POST /api/auth/signout** - Logout (NextAuth handles this)

### Phase 5: Auth Pages
1. **app/auth/signin/page.tsx** - Login page
   - Email + password form
   - Error handling
   - Redirect to dashboard on success

2. **app/auth/register/page.tsx** - Registration page
   - Email, name, password fields
   - Password confirmation
   - Input validation
   - Redirect to signin on success

### Phase 6: Session Management
1. Create `lib/session.ts` - Session utilities
2. Functions: `getServerSession()`, `requireAuth()`

### Phase 7: Middleware for Route Protection
1. Create `middleware.ts` - Protect private routes
2. Redirect unauthenticated users to signin

### Phase 8: Auth Context (Client-Side)
1. Create `app/providers.tsx` - SessionProvider wrapper
2. Update `app/layout.tsx` to include providers

## Security Considerations

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Best Practices
- Use bcryptjs with salt rounds (10)
- Store hashed passwords only
- Implement rate limiting (future improvement)
- Use HTTPS in production
- Implement CSRF protection (NextAuth handles this)
- Use secure session cookies

## File Structure

```
app/
├── api/
│   └── auth/
│       ├── [...nextauth]/
│       │   └── route.ts          # NextAuth API handler
│       └── register/
│           └── route.ts          # Registration endpoint
├── auth/
│   ├── signin/
│   │   └── page.tsx              # Login page
│   └── register/
│       └── page.tsx              # Registration page
├── providers.tsx                 # Session provider wrapper
└── layout.tsx                    # Root layout (updated)

lib/
├── auth.ts                       # NextAuth configuration
├── password.ts                   # Password hashing utilities
└── session.ts                    # Session helper functions

middleware.ts                     # Route protection middleware

.env                              # Updated with auth secrets
.env.example                      # Updated with auth secrets
```

## Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generated-secret>"

# Optional: OAuth providers (future)
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
```

## Testing Strategy

### Manual Testing
1. **Registration Flow**
   - Register new user
   - Verify user created in database
   - Verify password is hashed

2. **Login Flow**
   - Login with valid credentials
   - Login with invalid credentials
   - Verify session created

3. **Logout Flow**
   - Logout user
   - Verify session destroyed

4. **Route Protection**
   - Access protected route while logged out
   - Verify redirect to signin
   - Login and access protected route

### Verification Steps
```bash
# Check database
npx prisma studio

# Test API endpoints
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'
```

## Success Criteria

- [x] NextAuth.js v5 installed and configured
- [x] Password hashing with bcryptjs
- [x] Registration API endpoint working
- [x] Login/logout flow working
- [x] Session management functional
- [x] Protected routes implemented
- [x] Auth pages created (signin, register)
- [x] Environment variables configured
- [x] Manual testing completed
- [x] Code committed to git

## References

- NextAuth.js v5 Docs: https://authjs.dev/
- Prisma Adapter: https://authjs.dev/reference/adapter/prisma
- Next.js App Router Auth: https://nextjs.org/docs/app/building-your-application/authentication

## Next Steps (Step 5)

After authentication is complete, Step 5 will build core API endpoints:
- GET /api/tracks
- GET /api/albums
- GET /api/artists
- POST /api/playlists
- etc.

These endpoints will use the session management from Step 4 to verify authenticated users.
