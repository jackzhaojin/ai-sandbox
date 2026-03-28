# Step 29 Migration: User Management

This migration needs to be applied manually via Supabase SQL Editor because it contains ALTER TYPE commands that require elevated privileges.

## Migrations to Apply

Apply these migrations in order:

### 1. Main User Management Migration
**File:** `drizzle/migrations/0022_user_management.sql`

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/lmbrqiwzowiquebtsfyc
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the entire contents of `drizzle/migrations/0022_user_management.sql`
5. Click **Run**

**What it does:**
- Updates user_role enum from (admin, editor, viewer) to (viewer, author, admin)
- Creates site_members table to track per-site user access and roles
- Adds invitation_status enum and status field to invitations table
- Fixes invitations.site_id foreign key (was pointing to profiles, now correctly points to sites)
- Creates RLS policies for site_members and invitations
- Migrates existing data - adds all site creators to site_members as admins

### 2. Auth Trigger Update
**File:** `drizzle/migrations/0023_update_auth_trigger.sql`

1. In the same SQL Editor
2. Create a new query
3. Copy and paste the entire contents of `drizzle/migrations/0023_update_auth_trigger.sql`
4. Click **Run**

**What it does:**
- Updates the handle_new_user() function to use 'author' as the default role instead of 'editor'
- This affects new user signups going forward

## Verification

After running both migrations, verify in the Supabase dashboard:

### Tables
- [ ] site_members table exists with columns: id, site_id, user_id, role, joined_at, last_active_at
- [ ] invitations table has new status column

### Enums
- [ ] user_role enum has values: viewer, author, admin (not editor)
- [ ] invitation_status enum exists with values: pending, accepted, expired, revoked

### Data
- [ ] site_members has records for all existing site creators (as admins)

### RLS Policies
- [ ] site_members has 4 policies: select, insert, update, delete
- [ ] invitations has 3 policies: select, insert, update

## Testing Checklist

After applying migrations, test the following:

1. **Invite Flow**
   - [ ] Admin can invite users via /dashboard/[siteId]/settings/team
   - [ ] Invitation link works at /invite/[token]
   - [ ] User can accept invitation after signing in/up
   - [ ] User is added to site with correct role

2. **Team Management**
   - [ ] Can view all team members
   - [ ] Can change member roles (admins only)
   - [ ] Cannot demote last admin
   - [ ] Cannot remove self
   - [ ] Can remove other members (admins only)

3. **Profile Page**
   - [ ] Can access /profile
   - [ ] Can update display name and avatar
   - [ ] Can change password
   - [ ] Email and role are read-only

4. **Invitations**
   - [ ] Can see pending invitations
   - [ ] Can resend invitations
   - [ ] Can revoke invitations
   - [ ] Expired invitations are marked correctly

## Alternative: Proceed Without Migration

If you prefer to proceed with development first and apply the migration later, the code will still work but will reference the new schema. You can apply the migration when ready to test.
