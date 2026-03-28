# Authentication System

## Overview

This project uses **Auth.js v5 (NextAuth.js v5 beta)** for authentication with the following features:

- ✅ Email/Password credentials authentication
- ✅ JWT-based sessions
- ✅ Secure password hashing with bcrypt (cost factor 12)
- ✅ Login/Register/Logout flows
- ✅ Protected routes
- ✅ Session management helpers

## Implemented Files

### Core Authentication

- `lib/auth/auth.config.ts` - Auth.js configuration with credentials provider
- `lib/auth/index.ts` - Auth.js initialization and exports
- `lib/auth/actions.ts` - Server actions for register, login, logout
- `lib/auth/session.ts` - Session helpers (getSession, getCurrentUser, requireAuth)

### API Routes

- `app/api/auth/[...nextauth]/route.ts` - Auth.js API handler

### Pages

- `app/auth/login/page.tsx` - Login page
- `app/auth/register/page.tsx` - Registration page
- `app/auth/logout/page.tsx` - Logout confirmation page
- `app/auth/error/page.tsx` - Auth error page

### Components

- `components/auth/LoginForm.tsx` - Client-side login form
- `components/auth/RegisterForm.tsx` - Client-side registration form
- `components/auth/LogoutButton.tsx` - Logout button component
- `components/auth/UserProfile.tsx` - User profile display

### Pages Using Auth

- `app/page.tsx` - Home page (redirects to dashboard if authenticated)
- `app/dashboard/page.tsx` - Protected dashboard page

## Known Issues

### Build Error with Next.js 16

Currently experiencing build errors with Next.js 16.1.6 and next-auth@5.0.0-beta.30:

```
Error occurred prerendering page "/_global-error"
TypeError: Cannot read properties of null (reading 'useContext')
```

This is a known compatibility issue between:
- Next.js 16.x (latest)
- next-auth v5 beta
- React Server Components

### Workarounds

**Option 1: Use Development Mode**
```bash
npm run dev
```
Development mode works fine with all authentication features.

**Option 2: Downgrade Next.js**
Use Next.js 15.x for stable builds:
```bash
npm install next@15
```

**Option 3: Wait for Stable Release**
next-auth v5 is still in beta. Wait for stable release with full Next.js 16 support.

## Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Auth
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

## Usage

### Register a New User

```typescript
import { register } from '@/lib/auth/actions'

const result = await register({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe'
})
```

### Login

```typescript
import { login } from '@/lib/auth/actions'

const result = await login({
  email: 'user@example.com',
  password: 'password123'
})
```

### Get Current User

```typescript
import { getCurrentUser } from '@/lib/auth/session'

const user = await getCurrentUser()
if (user) {
  console.log(user.email)
}
```

### Protect a Page

```typescript
import { requireAuth } from '@/lib/auth/session'

export default async function ProtectedPage() {
  const user = await requireAuth() // Throws if not authenticated
  return <div>Welcome {user.name}!</div>
}
```

### Logout

```typescript
import { logout } from '@/lib/auth/actions'

await logout()
```

## Security Features

1. **Password Hashing**: bcrypt with cost factor 12
2. **JWT Sessions**: Secure, stateless sessions
3. **CSRF Protection**: Built into Auth.js
4. **Session Expiry**: 30 days
5. **Input Validation**: Email format, password strength (min 8 chars)
6. **SQL Injection Protection**: Drizzle ORM parameterized queries

## Testing the Auth System

### Manual Testing Steps

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. Click "REGISTER" to create a new account

4. Fill in email, password (min 8 chars), and optional name

5. Submit - should redirect to login page

6. Login with your credentials

7. Should redirect to `/dashboard` showing user profile

8. Click "LOGOUT" to sign out

9. Should redirect back to login page

### Database Verification

Check that user was created:
```sql
SELECT id, email, name, created_at FROM users;
```

## Next Steps (Future)

- Add OAuth providers (GitHub, Google)
- Email verification
- Password reset flow
- Two-factor authentication
- Rate limiting on login attempts
- Session management UI
- Account deletion

## Notes for Step 5

The authentication system is ready for use in Step 5 (API endpoints). All endpoints should use:

```typescript
import { requireAuth } from '@/lib/auth/session'

export async function GET(request: Request) {
  const user = await requireAuth()
  // User is authenticated, proceed with logic
}
```

---

**Status**: ✅ Authentication system implemented (functional in dev mode)
**Build Status**: ⚠️ Known issue with Next.js 16 + next-auth beta (use dev mode or downgrade Next.js)
