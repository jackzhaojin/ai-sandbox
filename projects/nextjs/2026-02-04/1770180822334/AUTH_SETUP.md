# Authentication Setup Guide

This document explains how to complete the authentication setup for PageForge CMS.

## Overview

The authentication system uses:
- **Supabase Auth** for user authentication (native, not Auth.js)
- **Email/Password** authentication
- **Automatic profile creation** via database trigger
- **Role-based access control** (admin, editor, viewer)
- **Middleware protection** for dashboard routes

## Database Trigger Setup

The SQL trigger must be applied to your Supabase database to automatically create profile records when users sign up.

### Method 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `drizzle/migrations/0001_auth_trigger.sql`
3. Run the query

### Method 2: Using psql

```bash
# Replace with your actual DATABASE_URL (with password)
psql "your_database_url" < drizzle/migrations/0001_auth_trigger.sql
```

### What the Trigger Does

When a new user signs up via Supabase Auth:
1. A record is automatically created in `auth.users` table
2. The trigger function `handle_new_user()` is called
3. A corresponding record is created in `public.profiles` table with:
   - `id`: Same as the auth user ID
   - `email`: From the auth user
   - `name`: From user metadata or derived from email
   - `role`: Defaults to `'editor'`
   - `avatar_url`: From user metadata if provided

## Authentication Flow

### 1. Registration Flow
1. User visits `/register`
2. Fills out: name, email, password
3. Form submits to Supabase Auth `signUp()`
4. Trigger automatically creates profile with role='editor'
5. User is redirected to `/login` with success message

### 2. Login Flow
1. User visits `/login`
2. Enters email and password
3. Form submits to Supabase Auth `signInWithPassword()`
4. On success, redirects to `/dashboard`
5. Middleware validates session

### 3. Logout Flow
1. User clicks logout in dropdown
2. POST request to `/logout` route
3. Supabase `signOut()` is called
4. User is redirected to `/login`

## Protected Routes

The middleware protects these routes:
- `/dashboard/*` - All dashboard pages
- `/editor/*` - Page editor

Unauthenticated users are redirected to `/login`.

Authenticated users visiting `/login` or `/register` are redirected to `/dashboard`.

## Server-Side Session Helpers

Located in `lib/auth/session.ts`:

### Basic Functions
```typescript
// Get current session
const session = await getSession()

// Get current user
const user = await getUser()

// Get user profile from database
const profile = await getUserProfile()
```

### Auth Guards
```typescript
// Require authentication (redirects to login if not authenticated)
const user = await requireAuth()

// Require admin role
const { user, profile } = await requireAdmin()

// Require editor or admin role
const { user, profile } = await requireEditor()
```

### Role Checks
```typescript
// Check if user has a specific role
const canEdit = await hasRole('editor')

// Check if user is admin
const admin = await isAdmin()

// Check if user is editor or admin
const editor = await isEditor()
```

## Client-Side Auth Context

For client components, you can use the auth context (located in `lib/auth/context.tsx`):

```typescript
'use client'

import { useAuth, useUser, useProfile, useIsAdmin, useIsEditor } from '@/lib/auth/context'

function MyComponent() {
  const { user, profile, loading } = useAuth()
  const currentUser = useUser()
  const currentProfile = useProfile()
  const isAdmin = useIsAdmin()
  const isEditor = useIsEditor()

  if (loading) return <div>Loading...</div>

  return <div>Welcome {profile?.name}</div>
}
```

## User Dropdown Component

The `UserDropdown` component is displayed in the dashboard header and shows:
- User avatar (or initials if no avatar)
- Display name and email
- Role badge (Admin/Editor/Viewer)
- Profile settings link
- Settings link
- Sign out button

## Role-Based Access Control

### Roles

1. **Admin** (`'admin'`)
   - Full access to all features
   - Can manage users, sites, pages, media, settings
   - Can change user roles

2. **Editor** (`'editor'`) - Default role
   - Can create and edit content
   - Can manage pages, media, templates
   - Cannot manage users or system settings

3. **Viewer** (`'viewer'`)
   - Read-only access
   - Can view content but cannot edit

### Changing User Roles

User roles can only be changed by admins through the database or admin UI (to be built in later steps).

To manually change a role via SQL:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'user@example.com';
```

## Testing the Authentication Flow

### Prerequisites
1. Database schema must be applied (Step 3)
2. Auth trigger must be applied (see above)
3. Environment variables must be set in `.env.local`

### Test Steps

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Test Registration**
   - Navigate to `http://localhost:3000/register`
   - Fill out the form
   - Submit and verify redirect to login

3. **Verify Profile Creation**
   - Check Supabase Dashboard → Table Editor → profiles
   - Should see new profile with role='editor'

4. **Test Login**
   - Navigate to `http://localhost:3000/login`
   - Enter credentials
   - Verify redirect to `/dashboard`

5. **Test Dashboard Access**
   - Should see dashboard with user dropdown
   - User dropdown should show name, email, role badge

6. **Test Logout**
   - Click user dropdown
   - Click "Sign Out"
   - Should redirect to login page

7. **Test Protected Routes**
   - While logged out, try to access `/dashboard`
   - Should redirect to `/login`

## Troubleshooting

### Profile Not Created After Registration
- Check that the trigger is installed: Run this query in Supabase SQL Editor:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```
- Check auth.users table to see if user was created
- Check Supabase logs for errors

### Login Redirects Back to Login
- Check browser console for errors
- Verify Supabase credentials in `.env.local`
- Check middleware is not blocking the route

### "Not Authenticated" Error in Dashboard
- Clear browser cookies
- Check Supabase session in browser DevTools → Application → Cookies
- Verify middleware is updating session correctly

### Role Checks Not Working
- Verify profile exists in database
- Check profile.role matches expected value
- Verify queries are using correct schema

## Security Notes

1. **Never expose service role key** to client-side code
2. **Always validate roles** on the server side
3. **Use RLS policies** (to be added in Step 5) for database security
4. **Never trust client-side role checks** for authorization
5. **Always use server-side helpers** for protected routes

## Next Steps

Step 5 will add:
- Row Level Security (RLS) policies
- Storage buckets for media
- Enhanced security for database access
