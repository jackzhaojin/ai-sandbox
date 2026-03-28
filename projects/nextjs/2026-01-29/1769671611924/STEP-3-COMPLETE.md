# Step 3 Complete: Design and implement database schema

**Date**: 2026-01-29
**Task**: Full-Stack Conversational Chat Application
**Step**: 3 of 8
**Status**: ✅ COMPLETE

---

## Summary

Successfully designed and implemented the complete database schema for the chat application using Prisma 7 with SQLite. Created all necessary tables, relationships, migrations, and seed data according to the research findings from Step 1.

---

## What Was Completed

### ✅ Database Schema Design

Implemented the complete schema with 4 models based on RESEARCH.md specifications:

1. **User** - User account information
2. **Conversation** - Chat conversations
3. **ConversationParticipant** - Many-to-many relationship between users and conversations
4. **Message** - Individual messages in conversations

### ✅ Prisma 7 Configuration

**Prisma 7 Breaking Changes Handled:**
- Created `prisma.config.ts` in project root (required for Prisma 7)
- Removed `url` field from schema datasource (moved to config file)
- Installed and configured SQLite adapter (`@prisma/adapter-better-sqlite3`)
- Updated Prisma client singleton to use adapter pattern

**Technology Decision:**
- Used **SQLite** instead of PostgreSQL for development
- Rationale: Simpler setup, no external database server required, works great for development
- Production can easily migrate to PostgreSQL by changing the adapter

### ✅ Schema Features

**Core Tables:**

#### Users Table
```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String?
  passwordHash String?  @map("password_hash")
  avatarUrl    String?  @map("avatar_url")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  messages                 Message[]
  conversationParticipants ConversationParticipant[]
}
```

#### Conversations Table
```prisma
model Conversation {
  id        String   @id @default(uuid())
  title     String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  messages     Message[]
  participants ConversationParticipant[]
}
```

#### Conversation Participants Table
```prisma
model ConversationParticipant {
  id             String    @id @default(uuid())
  conversationId String    @map("conversation_id")
  userId         String    @map("user_id")
  role           String    @default("member") // 'owner', 'member'
  joinedAt       DateTime  @default(now()) @map("joined_at")
  leftAt         DateTime? @map("left_at")

  conversation Conversation @relation(...)
  user         User         @relation(...)

  @@unique([conversationId, userId])
  @@index([userId])
}
```

#### Messages Table
```prisma
model Message {
  id             String    @id @default(uuid())
  conversationId String    @map("conversation_id")
  senderId       String?   @map("sender_id")
  content        String
  role           String    // 'user', 'assistant', 'system'
  metadata       String?   // JSON metadata as string
  isRead         Boolean   @default(false) @map("is_read")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  conversation Conversation @relation(...)
  sender       User?        @relation(...)

  @@index([conversationId, createdAt])
  @@index([senderId])
}
```

**Schema Considerations:**
- ✅ UUID primary keys for scalability and security
- ✅ Soft deletes via `leftAt` in participants table
- ✅ Metadata column for flexible AI response data storage (JSON as string for SQLite)
- ✅ Proper indexing for conversation message retrieval
- ✅ Cascade deletes for data integrity
- ✅ Timestamp tracking for audit trail
- ✅ Snake_case database column names with Prisma's `@map` directive

### ✅ Database Migration

Created and applied initial migration:
- Migration: `20260129075308_init`
- Location: `prisma/migrations/20260129075308_init/migration.sql`
- Status: Applied successfully
- Database: `dev.db` (SQLite)

### ✅ Seed Data

Created comprehensive seed script (`prisma/seed.ts`) with:

**Sample Data:**
- 2 demo users (Alice, Bob)
- 4 conversations (including one multi-user conversation)
- 9 messages (mix of user and AI assistant messages)
- 5 conversation participants

**Seed Features:**
- Realistic conversation examples
- AI assistant messages with metadata (model, tokens, finish reason)
- Both titled and untitled conversations
- Single-user and multi-user conversations
- Read/unread message states

**Verification:**
```
✅ Created demo users: { user1: 'alice@example.com', user2: 'bob@example.com' }
✅ Created demo conversations
✅ Created group conversation: Team Collaboration

Summary:
- Users: 2
- Conversations: 4
- Messages: 9
- Participants: 5
```

### ✅ Package Scripts Added

Added database management scripts to `package.json`:

```json
"db:generate": "prisma generate",
"db:migrate": "prisma migrate dev",
"db:migrate:deploy": "prisma migrate deploy",
"db:studio": "prisma studio",
"db:seed": "tsx prisma/seed.ts",
"db:reset": "prisma migrate reset"
```

### ✅ Dependencies Added

**New Dependencies:**
- `@prisma/adapter-better-sqlite3@^1.0.0` - SQLite adapter for Prisma 7
- `better-sqlite3@^11.7.0` - Native SQLite driver
- `dotenv@^16.4.7` - Environment variable loading for Prisma config
- `tsx@^4.21.0` - TypeScript executor for seed script

### ✅ Prisma Client Updated

Updated `lib/db/prisma.ts` to use Prisma 7 adapter pattern:

```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({
  url: 'file:./dev.db'
});

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
```

---

## Files Modified/Created

### Created (3 files):
1. `prisma.config.ts` - Prisma 7 configuration file (root level)
2. `prisma/seed.ts` - Database seed script with sample data
3. `STEP-3-COMPLETE.md` - This completion document

### Modified (5 files):
1. `prisma/schema.prisma` - Full database schema with 4 models
2. `package.json` - Added database scripts and prisma seed config
3. `lib/db/prisma.ts` - Updated to use Prisma 7 adapter pattern
4. `.env.example` - Updated DATABASE_URL comment for SQLite
5. `package-lock.json` - Updated with new dependencies

### Generated:
1. `prisma/migrations/20260129075308_init/migration.sql` - Initial migration
2. `dev.db` - SQLite database file (not tracked in git)
3. Updated `node_modules/@prisma/client` - Regenerated Prisma client

---

## Definition of Done Checklist

- ✅ Complete step: Design and implement database schema
- ✅ Do NOT build the entire application — only this step
- ✅ All code compiles and runs (build verified)
- ✅ Changes are committed to git

**All criteria met! Step 3 is complete.**

---

## What Works

1. **Database schema fully implemented** - All 4 models with proper relationships
2. **Prisma 7 configuration** - Successfully configured with SQLite adapter
3. **Database migration** - Migration created and applied successfully
4. **Seed data** - Comprehensive sample data loaded into database
5. **Type safety** - Prisma client generated with full TypeScript types
6. **Build verification** - `npm run build` completes successfully
7. **Database scripts** - All npm scripts work correctly:
   - ✅ `npm run db:generate` - Generates Prisma client
   - ✅ `npm run db:migrate` - Creates and applies migrations
   - ✅ `npm run db:seed` - Seeds database with sample data
   - ✅ `npm run db:studio` - Launches Prisma Studio
   - ✅ `npm run db:reset` - Resets database and re-seeds

---

## What Doesn't Work Yet (Expected)

The following are intentionally not implemented (they belong to future steps):

1. **Authentication** - Not implemented (Step 4)
2. **API endpoints** - Not implemented (Step 5)
3. **Chat UI components** - Not implemented (Step 6)
4. **Streaming functionality** - Not implemented (Step 5-6)
5. **Database queries in app** - Not integrated yet (Step 5)

---

## Blockers / Issues

### ⚠️ Non-Blocking Issues

**Issue 1: PostgreSQL → SQLite Migration**

**Decision:** Switched from PostgreSQL to SQLite for development
- **Reason:** PostgreSQL not installed, Docker daemon not running
- **Impact:** None for development; production can use PostgreSQL
- **Migration Path:** Change adapter to `@prisma/adapter-pg` and update datasource

**Issue 2: Prisma 7 Adapter Requirement**

**Challenge:** Prisma 7 requires adapters for all database connections (breaking change from v6)
- **Solution:** Installed `@prisma/adapter-better-sqlite3` and configured properly
- **Learning:** Adapter takes `{ url: string }` config object, not Database instance
- **Impact:** None; adapter pattern works well

**Issue 3: SQLite Type Limitations**

**Adjustments made:**
- Changed `Json` type to `String` for metadata (SQLite doesn't have native JSON)
- Removed `@db.Text` annotation (PostgreSQL-specific)
- Removed `sort: Desc` from index (SQLite limitation)

**Impact:** None; application logic can parse JSON from strings

### No Blockers

All functionality works as expected for Step 3.

---

## Technical Decisions

### Why SQLite Instead of PostgreSQL?

**Pros:**
- No external database server required
- Zero configuration - works out of the box
- Perfect for local development
- Single file database - easy to backup and share
- Fast for development workloads

**Cons:**
- Limited for production scale (but fine for MVP)
- No concurrent writes (not an issue for single-developer dev environment)
- Some PostgreSQL features unavailable

**Migration Path:**
- Change `datasource.provider` to `postgresql` in schema
- Switch adapter to `@prisma/adapter-pg`
- Update DATABASE_URL to PostgreSQL connection string
- Run `npx prisma migrate dev` to create PostgreSQL migration

### Prisma 7 Adapter Pattern

**Why Adapters Are Required:**
- Prisma 7's architecture shift to make client leaner and more flexible
- Allows runtime database driver selection
- Better edge runtime support
- Consistent pattern across all databases

**Implementation:**
```typescript
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });
```

---

## Database Schema Diagram

```
┌─────────────┐         ┌──────────────────────────┐         ┌────────────────┐
│    User     │         │ ConversationParticipant  │         │  Conversation  │
├─────────────┤         ├──────────────────────────┤         ├────────────────┤
│ id          │────┐    │ id                       │    ┌────│ id             │
│ email       │    │    │ conversationId           │────│    │ title          │
│ name        │    │    │ userId                   │    │    │ createdAt      │
│ passwordHash│    │    │ role                     │    │    │ updatedAt      │
│ avatarUrl   │    │    │ joinedAt                 │    │    └────────────────┘
│ createdAt   │    │    │ leftAt                   │    │            │
│ updatedAt   │    │    └──────────────────────────┘    │            │
└─────────────┘    │                 │                  │            │
       │           │                 │                  │            │
       │           └─────────────────┘                  │            │
       │                                                │            │
       │                                                │            │
       │    ┌───────────────────────────────────────────┘            │
       │    │                                                        │
       │    │                                                        │
       ▼    ▼                                                        ▼
┌─────────────────┐                                        ┌────────────────┐
│    Message      │────────────────────────────────────────│  Conversation  │
├─────────────────┤                                        └────────────────┘
│ id              │
│ conversationId  │ (FK)
│ senderId        │ (FK, nullable for AI)
│ content         │
│ role            │ ('user', 'assistant', 'system')
│ metadata        │ (JSON string)
│ isRead          │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
```

**Relationships:**
- User 1:N Message (sender)
- User 1:N ConversationParticipant
- Conversation 1:N Message
- Conversation 1:N ConversationParticipant
- ConversationParticipant N:1 User
- ConversationParticipant N:1 Conversation

---

## Sample Queries

Using the seeded data:

```typescript
// Get all conversations for a user
const conversations = await prisma.conversation.findMany({
  where: {
    participants: {
      some: {
        userId: user.id,
        leftAt: null, // Only active participants
      },
    },
  },
  include: {
    messages: {
      orderBy: { createdAt: 'desc' },
      take: 1, // Last message
    },
    participants: {
      include: {
        user: true,
      },
    },
  },
});

// Get all messages in a conversation
const messages = await prisma.message.findMany({
  where: {
    conversationId: conversationId,
  },
  include: {
    sender: true,
  },
  orderBy: {
    createdAt: 'asc',
  },
});

// Create a new message
const message = await prisma.message.create({
  data: {
    conversationId: conversationId,
    senderId: userId,
    content: 'Hello!',
    role: 'user',
  },
});
```

---

## Next Steps (Step 4)

The next step should implement authentication:

1. Set up Auth.js (NextAuth v5)
2. Create login/register pages
3. Implement session management
4. Add protected route middleware
5. Hash passwords with bcrypt
6. Test authentication flow

See `RESEARCH.md` Section 4.4 for authentication approach.

---

## Notes

### Prisma 7 Resources Consulted

- [Prisma Config Reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
- [Upgrade to Prisma ORM 7](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [SQLite Database Connector](https://www.prisma.io/docs/orm/overview/databases/sqlite)
- [Database Drivers](https://www.prisma.io/docs/orm/overview/databases/database-drivers)
- [Next.js + Prisma 7 + SQLite: The Modern Way](https://revione.medium.com/next-js-prisma-7-sqlite-the-modern-way-to-use-sql-with-libsql-21e207ce2235)

### Key Learnings

1. **Prisma 7 Breaking Changes:**
   - Adapters are now required for all database connections
   - `url` field removed from schema, moved to `prisma.config.ts`
   - Client instantiation requires adapter: `new PrismaClient({ adapter })`

2. **SQLite Adapter:**
   - Use `@prisma/adapter-better-sqlite3` for Node.js
   - Use `@prisma/adapter-libsql` for Bun
   - Configuration: `new PrismaBetterSqlite3({ url: 'file:./dev.db' })`

3. **SQLite Limitations:**
   - No native JSON type (use String and parse)
   - No DESC in index definition
   - No `@db.Text` annotation
   - All handled gracefully with workarounds

4. **Development Experience:**
   - SQLite is excellent for local development
   - Prisma Studio works perfectly with SQLite
   - Migration system works identically to PostgreSQL
   - Type generation is unaffected by database choice

---

**Document Status:** ✅ Complete
**Last Updated:** 2026-01-29
**Author:** Claude (Continuous Executive Agent)
**Output Directory:** `/Users/jackjin/dev/agent-outputs/projects/nextjs/2026-01-29/1769671611924`
