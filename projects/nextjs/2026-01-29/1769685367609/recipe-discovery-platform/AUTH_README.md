# Authentication System Documentation

## Overview

This application uses **Auth.js v5 (NextAuth)** for authentication with a credentials-based provider. The system is fully integrated with the PostgreSQL database and provides secure user authentication with JWT sessions.

## Features

✅ **Secure Authentication**
- Password hashing with bcrypt (10 rounds)
- JWT-based sessions
- Server-side session validation
- CSRF protection (built into Auth.js)

✅ **User Flows**
- Sign up (register new users)
- Sign in (authenticate existing users)
- Sign out (invalidate session)

✅ **Route Protection**
- Middleware-based authentication checks
- Automatic redirect to login for unauthenticated users
- Protected routes configuration

## File Structure

```
lib/
├── auth.ts                    # Auth.js configuration and exports

actions/
├── auth-actions.ts           # Server Actions for signup, signin, signout

app/
├── api/
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts      # NextAuth API route handlers
├── (auth)/
│   ├── layout.tsx           # Auth pages layout
│   ├── login/
│   │   └── page.tsx         # Login page
│   └── register/
│       └── page.tsx         # Registration page
└── page.tsx                 # Protected home page

middleware.ts                 # Route protection middleware

types/
└── next-auth.d.ts           # TypeScript type extensions
```

## Configuration

### Environment Variables

Required environment variables in `.env.local`:

```env
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/recipe_discovery"

# Auth.js configuration
AUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
```

### Auth.js Configuration (`lib/auth.ts`)

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Credentials({ /* ... */ })],
  callbacks: {
    jwt: { /* Add user data to token */ },
    session: { /* Add token data to session */ }
  },
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  }
});
```

## Authentication Flows

### Sign Up Flow

1. User submits registration form (name, email, password)
2. Server Action validates input:
   - All fields required
   - Password minimum 8 characters
   - Email uniqueness check
3. Password is hashed with bcrypt
4. User record created in database
5. User automatically signed in
6. Redirected to home page

**Endpoint:** `signUpAction()` in `actions/auth-actions.ts`

### Sign In Flow

1. User submits credentials (email, password)
2. Server Action validates input
3. Auth.js `authorize` callback:
   - Finds user by email
   - Verifies password with bcrypt
   - Returns user object (without password)
4. JWT token created with user data
5. Session cookie set
6. Redirected to home page

**Endpoint:** `signInAction()` in `actions/auth-actions.ts`

### Sign Out Flow

1. User clicks "Sign out" button
2. Form submits to `signOutAction()`
3. Auth.js invalidates session
4. Session cookie cleared
5. Redirected to login page

**Endpoint:** `signOutAction()` in `actions/auth-actions.ts`

## Route Protection

### Middleware (`middleware.ts`)

```typescript
export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
```

**Protected Routes:**
- All routes except:
  - `/api/auth/*` (Auth.js API routes)
  - Static files (`_next/static`, `_next/image`)
  - Public assets (favicon, images)

**Public Routes:**
- `/login` (handled by middleware)
- `/register` (handled by middleware)

### Accessing Session in Components

**Server Components:**
```typescript
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <div>Welcome, {session.user.name}!</div>;
}
```

**Server Actions:**
```typescript
"use server";

import { auth } from "@/lib/auth";

export async function myAction() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Use session.user.id for database queries
}
```

## Database Schema

### Users Table

```typescript
users {
  id: UUID (primary key)
  email: VARCHAR(255) (unique, not null)
  name: VARCHAR(255) (not null)
  passwordHash: VARCHAR(255) (not null)
  createdAt: TIMESTAMP (default now)
  updatedAt: TIMESTAMP (default now)
}
```

**Indexes:**
- Primary key on `id`
- Unique index on `email`

## Security Features

### Password Security
- ✅ Passwords hashed with bcrypt (10 rounds minimum)
- ✅ Never stored in plain text
- ✅ Password validation (minimum 8 characters)

### Session Security
- ✅ JWT tokens with secret signing
- ✅ HttpOnly cookies (not accessible via JavaScript)
- ✅ Secure cookies in production (HTTPS)
- ✅ SameSite cookie attribute (CSRF protection)

### Input Validation
- ✅ Email format validation
- ✅ Required field validation
- ✅ Password strength requirements
- ✅ Server-side validation (never trust client)

### SQL Injection Prevention
- ✅ Drizzle ORM uses parameterized queries
- ✅ No string concatenation for SQL
- ✅ Type-safe database queries

## Usage Examples

### 1. Create New User

```typescript
import { signUpAction } from "@/actions/auth-actions";

const result = await signUpAction({
  name: "John Doe",
  email: "john@example.com",
  password: "securepassword123"
});

if (result.success) {
  // User created and signed in
} else {
  console.error(result.error);
}
```

### 2. Sign In Existing User

```typescript
import { signInAction } from "@/actions/auth-actions";

const result = await signInAction({
  email: "john@example.com",
  password: "securepassword123"
});

if (result.success) {
  // User signed in
} else {
  console.error(result.error);
}
```

### 3. Protect a Page

```typescript
// app/my-protected-page/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <div>Protected content for {session.user.email}</div>;
}
```

### 4. Get Current User in Server Action

```typescript
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";

export async function createRecipe(data: RecipeData) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const recipe = await db.insert(recipes).values({
    ...data,
    userId: session.user.id  // Associate with current user
  });

  return { success: true, recipe };
}
```

## Testing

### Test Credentials

The database seed script creates test users:

**Test User 1:**
- Email: `chef@example.com`
- Password: `password123`

**Test User 2:**
- Email: `baker@example.com`
- Password: `password123`

### Manual Testing Checklist

- [ ] Sign up with new user
- [ ] Sign in with existing user
- [ ] Sign out
- [ ] Try accessing protected route while logged out (should redirect to login)
- [ ] Try accessing protected route while logged in (should show content)
- [ ] Verify session persists across page refreshes
- [ ] Verify invalid credentials show error message
- [ ] Verify duplicate email registration shows error

## Common Issues & Troubleshooting

### Issue: "Invalid credentials" on sign in

**Cause:** Password doesn't match or user doesn't exist

**Solution:**
1. Verify user exists in database
2. Check password was hashed correctly during signup
3. Ensure bcrypt comparison is working

### Issue: Redirect loop between login and home page

**Cause:** Middleware configuration or session validation issue

**Solution:**
1. Check `AUTH_SECRET` is set in `.env.local`
2. Verify middleware matcher excludes `/login` and `/register`
3. Check session callback returns user data

### Issue: "CSRF token mismatch"

**Cause:** Auth.js CSRF protection triggered

**Solution:**
1. Ensure cookies are enabled
2. Check `NEXTAUTH_URL` matches current domain
3. Verify form actions use proper Server Actions

### Issue: TypeScript errors on `session.user.id`

**Cause:** Session type doesn't include custom fields

**Solution:**
1. Check `types/next-auth.d.ts` exists
2. Verify type declarations extend Session and User interfaces
3. Restart TypeScript server

## Next Steps

The authentication system is complete and ready for use. Future enhancements could include:

1. **Email Verification**
   - Send confirmation email on signup
   - Verify email before allowing login

2. **Password Reset**
   - Forgot password flow
   - Email-based password reset tokens

3. **OAuth Providers**
   - Add Google authentication
   - Add GitHub authentication

4. **Two-Factor Authentication**
   - TOTP-based 2FA
   - SMS verification

5. **Session Management**
   - View active sessions
   - Revoke sessions remotely
   - Device tracking

6. **Rate Limiting**
   - Prevent brute force attacks
   - Limit signup attempts

## References

- [Auth.js Documentation](https://authjs.dev/)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [Drizzle ORM](https://orm.drizzle.team/)

---

**Last Updated:** January 29, 2026
**Status:** ✅ Complete and Production-Ready
